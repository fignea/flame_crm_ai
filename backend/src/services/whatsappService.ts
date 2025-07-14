import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { connectionService } from './connectionService';
import { getIO } from './socketService';
import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import { normalizeNumber } from '../utils/phoneUtils';
import { BotFlowService } from './botFlowService';

// Mapa para gestionar múltiples sesiones por connectionId
const sessions: Record<string, WASocket> = {};
const qrCodes: Record<string, string> = {};
const connectionStates: Record<string, string> = {};
const connectionLocks: Record<string, boolean> = {}; // Bloqueos para evitar sesiones duplicadas
const reconnectTimeouts: Record<string, NodeJS.Timeout> = {}; // Timeouts de reconexión
const retryCounters: Record<string, number> = {}; // Contador de reintentos por conexión

export const getSession = (connectionId: string): WASocket | undefined => sessions[connectionId];
export const getQrCode = (connectionId: string): string | undefined => qrCodes[connectionId];

// Función para limpiar recursos de una conexión
const cleanupConnection = (connectionId: string) => {
  delete sessions[connectionId];
  delete qrCodes[connectionId];
  delete connectionStates[connectionId];
  delete connectionLocks[connectionId];
  
  // Limpiar timeout de reconexión si existe
  if (reconnectTimeouts[connectionId]) {
    clearTimeout(reconnectTimeouts[connectionId]);
    delete reconnectTimeouts[connectionId];
  }
};

// Función para restaurar sesiones automáticamente
export const restoreSessions = async () => {
  try {
    console.log('🔄 Restaurando sesiones de WhatsApp...');
    
    // Obtener todas las conexiones que son por defecto
    const connections = await prisma.connection.findMany({
      where: {
        type: 'whatsapp_web',
        isDefault: true
      }
    });
    
    for (const connection of connections) {
      console.log(`🔄 Restaurando sesión para conexión por defecto: ${connection.name} (${connection.id})`);
      
      try {
        // Verificar si existen archivos de sesión
        const authFolder = path.resolve(process.cwd(), `sessions/${connection.id}`);
        if (fs.existsSync(authFolder)) {
          // Intentar restaurar la sesión
          await startWhatsAppSession(connection.id);
          logger.info(`✅ Sesión restaurada para: ${connection.name}`);
        } else {
          logger.warn(`⚠️ No se encontraron archivos de sesión para: ${connection.name}`);
          // Actualizar estado en la base de datos a DISCONNECTED
          await connectionService.updateStatus(connection.id, 'DISCONNECTED');
        }
      } catch (error) {
        logger.error(`❌ Error restaurando sesión para ${connection.name}:`, error);
        // Actualizar estado en la base de datos a DISCONNECTED
        await connectionService.updateStatus(connection.id, 'DISCONNECTED');
      }
    }
    
    logger.info('✅ Restauración de sesiones completada');
  } catch (error) {
    console.error('❌ Error en la restauración de sesiones:', error);
  }
};

export const startWhatsAppSession = async (connectionId: string, onQr?: (qr: string) => void) => {
  // Verificar si ya hay una sesión activa y conectada
  if (sessions[connectionId] && connectionStates[connectionId] === 'open') {
    console.log(`Sesión ${connectionId} ya está activa y conectada`);
    return sessions[connectionId];
  }

  // Verificar si hay un bloqueo activo
  if (connectionLocks[connectionId]) {
    console.log(`Sesión ${connectionId} está siendo iniciada por otro proceso`);
    return sessions[connectionId];
  }

  // Establecer bloqueo
  connectionLocks[connectionId] = true;

  try {
    // Limpiar sesión anterior si existe
    if (sessions[connectionId]) {
      try {
        await sessions[connectionId].logout();
      } catch (error) {
        console.log(`Error cerrando sesión anterior ${connectionId}:`, error);
      }
      cleanupConnection(connectionId);
  }

  const authFolder = path.resolve(process.cwd(), `sessions/${connectionId}`);
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['FlameAI', 'Chrome', '110.0.0.0'],
      // Configuraciones adicionales para evitar conflictos
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 2000,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCodes[connectionId] = qr;
      connectionStates[connectionId] = 'connecting';
      if (onQr) onQr(qr);
      // Actualizar QR en la base de datos
      connectionService.updateStatus(connectionId, 'CONNECTING', qr).catch(console.error);
    }
    
    if (connection === 'close') {
      connectionStates[connectionId] = 'closed';
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      // Incrementar contador de reintentos
      retryCounters[connectionId] = (retryCounters[connectionId] || 0) + 1;

      if (shouldReconnect && retryCounters[connectionId] <= 3) {
        console.log(`Reconectando sesión ${connectionId} (intento ${retryCounters[connectionId]})...`);
        connectionService.updateStatus(connectionId, 'CONNECTING').catch(console.error);
          
          // Limpiar la sesión actual
          cleanupConnection(connectionId);
          
          // Programar reconexión con delay exponencial
          const delay = Math.min(5000 * Math.pow(2, retryCounters[connectionId] - 1), 30000); // 5s, 10s, 20s
          
          console.log(`Programando reconexión para ${connectionId} en ${delay}ms`);
          
          reconnectTimeouts[connectionId] = setTimeout(() => {
            delete reconnectTimeouts[connectionId];
            startWhatsAppSession(connectionId, onQr).catch(console.error);
          }, delay);
      } else {
        console.log(`La sesión ${connectionId} se cerró permanentemente o excedió los reintentos.`);
        connectionService.updateStatus(connectionId, 'DISCONNECTED').catch(console.error);
        cleanupConnection(connectionId);
        delete retryCounters[connectionId]; // Limpiar contador
      }
    }
    
    if (connection === 'open') {
      connectionStates[connectionId] = 'open';
      delete qrCodes[connectionId];
      retryCounters[connectionId] = 0; // Resetear contador en conexión exitosa
      console.log(`WhatsApp conectado exitosamente para sesión ${connectionId}`);
      
      // Sincronizar historial de mensajes de la última semana
      console.log(`🔄 [SYNC] Programando sincronización para ${connectionId} en 5 segundos...`);
      setTimeout(async () => {
        try {
          console.log(`🔄 [SYNC] Iniciando sincronización de historial para ${connectionId}...`);
          await syncMessageHistory(sock, connectionId);
        } catch (error) {
          console.error(`❌ [SYNC] Error sincronizando historial:`, error);
        }
      }, 5000); // Esperar 5 segundos después de conectar
      
      // Actualizar estado en la base de datos
      connectionService.updateStatus(connectionId, 'CONNECTED').catch(console.error);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const io = getIO();
    const firstMessage = messages[0];

    // Ignorar si no hay mensaje o si es un evento de estado sin contenido
    if (!firstMessage || !firstMessage.message) {
      return;
    }

    const from = firstMessage.key.remoteJid;

    // Ignorar si no hay remitente o si es un grupo
    if (!from || from.endsWith('@g.us')) {
      logger.info('Mensaje de grupo o sin remitente ignorado.', { from });
      return;
    }

    // Manejar reacciones
    const reaction = firstMessage.message.reactionMessage;
    if (reaction && reaction.key && reaction.key.id && reaction.text !== undefined) {
      try {
        const originalMessage = await prisma.message.findFirst({
          where: { id: reaction.key.id }
        });

        if (originalMessage) {
          const updatedMessage = await prisma.message.update({
            where: { id: originalMessage.id },
            data: { reaction: reaction.text || null } as any, // Forzar tipo para evitar error de linter
            include: {
              contact: true,
            },
          });

          // Obtener companyId de la conexión asociada al mensaje
          const connection = await prisma.connection.findUnique({
            where: { id: updatedMessage.connectionId }
          });

          if (connection) {
            const owner = await prisma.user.findFirst({
              where: { companyId: connection.companyId, profile: 'admin' },
            });

            if (owner) {
              io.to(owner.id).emit('messageUpdated', { ...updatedMessage, connection });
              logger.info(`Reacción actualizada y emitida para mensaje ${originalMessage.id}`);
            }
          }
        }
        return; // Detener el procesamiento aquí para las reacciones
      } catch (error) {
        logger.error('Error procesando reacción:', error);
        return;
      }
    }

    const fromMe = firstMessage.key.fromMe || false;
    const content = firstMessage.message.conversation || firstMessage.message.extendedTextMessage?.text || '';

    if (fromMe) {
      logger.info('Mensaje propio ignorado.', { from, content });
      return;
    }

    // Ignorar mensajes sin contenido (cambios de estado, publicaciones, etc.)
    if (!content || content.trim() === '') {
      logger.info('Mensaje sin contenido ignorado.', { from, messageType: Object.keys(firstMessage.message) });
      return;
    }

    // Ignorar mensajes que son solo emojis de estado o publicaciones
    const isStatusMessage = content.match(/^[👽🍷🎾🎮🩺📱💻🎵📷🎬📚🎮🏀⚽🎾🎯🎲🎪🎭🎨🎬🎤🎧🎼🎹🎸🎻🥁🎺🎷🎼🎵🎶🎤🎧🎼🎹🎸🎻🥁🎺🎷🎼🎵🎶]+$/);
    const isTypingIndicator = content.includes('está escribiendo') || content.includes('typing');
    const isStatusUpdate = content.includes('cambió su foto de perfil') || content.includes('cambió su nombre') || content.includes('cambió su estado');
    
    if (isStatusMessage || isTypingIndicator || isStatusUpdate) {
      logger.info('Mensaje de estado/publicación ignorado.', { from, content, messageType: Object.keys(firstMessage.message) });
      return;
    }

    try {
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        logger.warn(`Conexión ${connectionId} no encontrada para mensaje entrante.`);
        return;
      }

      const contactNumber = from.split('@')[0];
      if (!contactNumber) {
        logger.warn('No se pudo obtener el número del remitente.', { from });
        return;
      }

      const normalizedNumber = normalizeNumber(contactNumber);

      let contact = await prisma.contact.findFirst({
        where: { number: normalizedNumber, companyId: connection.companyId },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            name: firstMessage.pushName || normalizedNumber,
            number: normalizedNumber,
            companyId: connection.companyId,
          },
        });
        logger.info('Nuevo contacto creado:', contact);
      }

      let conversation = await prisma.conversation.findFirst({
        where: { contactId: contact.id, connectionId: connection.id },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            contactId: contact.id,
            connectionId: connection.id,
            unreadCount: 0,
          },
        });
        logger.info('Nueva conversación creada:', conversation);
      }

      // --- INICIO LÓGICA DE MENSAJE AUTOMÁTICO ---
      // Solo enviar si es el primer mensaje de la conversación de la sesión actual (no spam)
      const lastAutoMessage = await prisma.message.findFirst({
        where: {
          conversationId: conversation.id,
          fromMe: true,
          content: { startsWith: '[AUTO]' },
        },
        orderBy: { timestamp: 'desc' },
      });
      
      const now = new Date();
      // Convertir a zona horaria de Argentina (UTC-3)
      const argentinaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      const dayOfWeek = argentinaTime.getDay(); // 0=Domingo, 1=Lunes, ...
      const currentTime = argentinaTime.toTimeString().slice(0,5); // 'HH:MM'
      
      logger.info(`🔍 [AUTO] Verificando programaciones automáticas:`, {
        connectionId: connection.id,
        utcTime: now.toISOString(),
        argentinaTime: argentinaTime.toISOString(),
        dayOfWeek,
        currentTime,
        hasLastAutoMessage: !!lastAutoMessage
      });
      
      const schedules = await prisma.autoMessageSchedule.findMany({
        where: {
          connectionId: connection.id,
          isActive: true,
        },
      });
      
      logger.info(`🔍 [AUTO] Programaciones encontradas:`, schedules.length);
      
      for (const schedule of schedules) {
        logger.info(`🔍 [AUTO] Verificando programación ${schedule.id}:`, {
          daysOfWeek: schedule.daysOfWeek,
          timeRanges: schedule.timeRanges,
          message: schedule.message
        });
        
        // Verificar si el día actual está en los días configurados
        const dayMatch = Array.isArray(schedule.daysOfWeek) 
          ? schedule.daysOfWeek.includes(dayOfWeek)
          : JSON.parse(schedule.daysOfWeek as any).includes(dayOfWeek);
        
        logger.info(`🔍 [AUTO] Día coincide: ${dayMatch} (día actual: ${dayOfWeek}, días configurados: ${schedule.daysOfWeek})`);
        
        if (!dayMatch) continue;
        
        // Verificar si la hora actual está en los rangos configurados
        const ranges = Array.isArray(schedule.timeRanges) ? schedule.timeRanges : JSON.parse(schedule.timeRanges as any);
        const inRange = ranges.some((r: any) => {
          const timeMatch = r.from <= currentTime && currentTime <= r.to;
          logger.info(`🔍 [AUTO] Rango ${r.from}-${r.to}: ${timeMatch} (hora actual: ${currentTime})`);
          return timeMatch;
        });
        
        logger.info(`🔍 [AUTO] Hora en rango: ${inRange}`);
        
        if (inRange && !lastAutoMessage) {
          // Enviar mensaje automático solo si no se envió ya en esta conversación
          const autoMessageContent = `[AUTO] ${schedule.message}`;
          logger.info(`🚀 [AUTO] Enviando mensaje automático a ${normalizedNumber}: ${autoMessageContent}`);
          
          try {
            // Enviar el mensaje a WhatsApp
            const sentMessage = await sendMessage(connection.id, normalizedNumber, autoMessageContent);
            
            // Guardar el mensaje automático en la base de datos
            const autoMessage = await prisma.message.create({
              data: {
                id: sentMessage?.key?.id ?? uuidv4(),
                fromMe: true,
                content: autoMessageContent,
                status: 'sent',
                timestamp: new Date(),
                contactId: contact.id,
                conversationId: conversation.id,
                connectionId: connection.id,
              },
              include: {
                contact: true,
                connection: true,
              },
            });
            
            // Emitir evento de nuevo mensaje automático
            const companyRoom = `company-${connection.companyId}`;
            io.to(companyRoom).emit('newMessage', autoMessage);
            
            logger.info(`✅ [AUTO] Mensaje automático enviado y guardado a ${normalizedNumber} por programación (${schedule.id})`);
            break;
          } catch (error) {
            logger.error(`❌ [AUTO] Error enviando mensaje automático:`, error);
          }
        } else {
          logger.info(`⏭️ [AUTO] No se envía mensaje automático:`, {
            inRange,
            hasLastAutoMessage: !!lastAutoMessage
          });
        }
      }
      // --- FIN LÓGICA DE MENSAJE AUTOMÁTICO ---

      // --- INICIO LÓGICA DE BOT FLOWS ---
      // Solo procesar bot flows para mensajes entrantes (no propios)
      if (!fromMe) {
        const botResult = await BotFlowService.processMessage(content, connection.id, firstMessage.key.id ?? uuidv4());
        
        if (botResult && botResult.responses.length > 0) {
          logger.info(`🤖 [BOT] Enviando ${botResult.responses.length} respuestas automáticas`);
          
          // Enviar cada respuesta con su delay correspondiente
          for (const response of botResult.responses) {
            if (response.delay > 0) {
              await new Promise(resolve => setTimeout(resolve, response.delay));
            }
            
            const botMessageContent = response.responseType === 'text' 
              ? response.message 
              : `[${response.responseType.toUpperCase()}] ${response.message}`;
            
            try {
              // Enviar el mensaje a WhatsApp
              const sentMessage = await sendMessage(connection.id, normalizedNumber, botMessageContent);
              
              // Guardar el mensaje del bot en la base de datos
              const botMessage = await prisma.message.create({
                data: {
                  id: sentMessage?.key?.id ?? uuidv4(),
                  fromMe: true,
                  content: botMessageContent,
                  status: 'sent',
                  timestamp: new Date(),
                  contactId: contact.id,
                  conversationId: conversation.id,
                  connectionId: connection.id,
                },
                include: {
                  contact: true,
                  connection: true,
                },
              });
              
              // Emitir evento de nuevo mensaje del bot
              const companyRoom = `company-${connection.companyId}`;
              io.to(companyRoom).emit('newMessage', botMessage);
              
              logger.info(`🤖 [BOT] Respuesta enviada: ${botMessageContent}`);
            } catch (error) {
              logger.error(`❌ [BOT] Error enviando respuesta: ${error}`);
            }
          }
        }
      }
      // --- FIN LÓGICA DE BOT FLOWS ---

      const newMessage = await prisma.message.create({
        data: {
          id: firstMessage.key.id ?? uuidv4(),
          fromMe,
          content: content,
          status: 'received',
          timestamp: new Date(firstMessage.messageTimestamp as number * 1000),
          contactId: contact.id,
          conversationId: conversation.id,
          connectionId: connection.id,
        },
        include: {
          contact: true,
          connection: true,
        },
      });

      // Emitir evento de nuevo mensaje a los clientes
      const companyRoom = `company-${connection.companyId}`;
      io.to(companyRoom).emit('newMessage', newMessage);

      logger.info('Nuevo mensaje recibido y emitido vía socket', {
        conversationId: conversation.id,
        contact: contact.name,
      });

    } catch (error) {
      logger.error('Error procesando mensaje entrante:', error);
    }
  });

  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      console.log('[Baileys][messages.update] update:', JSON.stringify(update, null, 2));
      if (!update.key || !update.update) continue;
      const { id } = update.key;
      const { status } = update.update;
      if (!id || typeof status === 'undefined') continue;

      // Mapear el status de Baileys a nuestro modelo
      let newStatus = null;
      if (status === 1) newStatus = 'sent';
      if (status === 2) newStatus = 'delivered';
      if (status === 3) newStatus = 'delivered'; // Cambiar: status 3 = entregado al dispositivo, no leído
      if (status === 4) newStatus = 'read'; // Status 4 = leído
      console.log(`[Baileys][messages.update] id: ${id}, status: ${status}, newStatus: ${newStatus}`);
      console.log(`[Baileys][messages.update] remoteJid: ${update.key.remoteJid}, fromMe: ${update.key.fromMe}`);

      if (newStatus) {
        console.log(`🔍 [DEBUG] Buscando mensaje con ID: ${id} en la base de datos`);
        
        // Primero buscar el mensaje para ver si existe
        const existingMessage = await prisma.message.findUnique({ where: { id } });
        console.log(`🔍 [DEBUG] Mensaje encontrado en BD:`, existingMessage);
        
        if (!existingMessage && update.key.fromMe) {
          // El mensaje no existe en la BD pero fue enviado por nosotros
          console.log(`🔄 [SYNC] Mensaje enviado desde otro dispositivo, intentando obtener contenido real...`);
          
          let messageContent = '[Mensaje sincronizado desde otro dispositivo]';
          
          // Intentar obtener el contenido real del mensaje desde el store de Baileys
          if (update.key.remoteJid) {
            try {
              // Acceder al store de mensajes de Baileys
              const messageStore = (sock as any).store?.messages;
              let found = null;
              if (messageStore && messageStore[update.key.remoteJid]) {
                const conversationMessages = messageStore[update.key.remoteJid];
                found = conversationMessages.find((msg: any) => msg.key && msg.key.id === id);
              }
              // Si no se encuentra en el store, intentar cargar del historial remoto
              if (!found) {
                try {
                  const history = await (sock as any).loadMessages(update.key.remoteJid, { count: 20 });
                  if (history && Array.isArray(history)) {
                    found = history.find((msg: any) => msg.key && msg.key.id === id);
                  }
                } catch (err) {
                  console.log(`⚠️ [SYNC] Error al cargar historial remoto:`, err);
                }
              }
              if (found && found.message) {
                console.log(`🔄 [SYNC] Mensaje encontrado en store/historial, extrayendo contenido...`);
                // Extraer contenido del mensaje usando la misma lógica que en messages.upsert
                if (found.message.conversation) {
                  messageContent = found.message.conversation;
                } else if (found.message.extendedTextMessage?.text) {
                  messageContent = found.message.extendedTextMessage.text;
                } else if (found.message.imageMessage?.caption) {
                  messageContent = found.message.imageMessage.caption || '[Imagen]';
                } else if (found.message.videoMessage?.caption) {
                  messageContent = found.message.videoMessage.caption || '[Video]';
                } else if (found.message.audioMessage) {
                  messageContent = '[Audio]';
                } else if (found.message.documentMessage) {
                  messageContent = '[Documento]';
                } else if (found.message.stickerMessage) {
                  messageContent = '[Sticker]';
                } else if (found.message.locationMessage) {
                  messageContent = '[Ubicación]';
                } else if (found.message.contactMessage) {
                  messageContent = '[Contacto]';
                } else {
                  messageContent = '[Mensaje multimedia]';
                }
                console.log(`🔄 [SYNC] Contenido real obtenido: "${messageContent}"`);
              } else {
                console.log(`⚠️ [SYNC] Mensaje no encontrado en store ni historial, usando contenido genérico`);
              }
            } catch (error) {
              console.log(`⚠️ [SYNC] Error obteniendo contenido del store/historial:`, error);
            }
          }
          
          const syncedMessage = await createSyncedMessage(id, update.key.remoteJid || undefined, newStatus, connectionId, messageContent);
          if (syncedMessage) {
            // Emitir evento de nuevo mensaje
            const io = getIO();
            const companyRoom = `company-${syncedMessage.connection.companyId}`;
            io.to(companyRoom).emit('newMessage', syncedMessage);
            console.log(`🔄 [SYNC] Evento newMessage emitido para mensaje sincronizado con contenido: "${messageContent}"`);
          }
        }
        
        // Verificar el estado actual del mensaje antes de actualizar
        const currentMessage = await prisma.message.findUnique({ where: { id } });
        let updatedCount = 0;
        
        if (currentMessage) {
          // Definir la jerarquía de estados (de menor a mayor)
          const statusHierarchy = ['sent', 'delivered', 'read'];
          const currentStatusIndex = statusHierarchy.indexOf(currentMessage.status);
          const newStatusIndex = statusHierarchy.indexOf(newStatus);
          
          // Solo actualizar si el nuevo estado es igual o superior al actual
          if (newStatusIndex >= currentStatusIndex) {
            const updated = await prisma.message.updateMany({
              where: { id },
              data: { status: newStatus }
            });
            updatedCount = updated.count;
            console.log(`🔍 [DEBUG] Mensajes actualizados: ${updatedCount} (${currentMessage.status} -> ${newStatus})`);
          } else {
            console.log(`⚠️ [DEBUG] Ignorando actualización de estado: ${currentMessage.status} -> ${newStatus} (retroceso no permitido)`);
          }
        } else {
          console.log(`⚠️ [DEBUG] Mensaje no encontrado en BD para actualización: ${id}`);
        }

        // Emitir evento de actualización por socket si hubo cambio
        if (updatedCount > 0) {
          const msg = await prisma.message.findUnique({ 
            where: { id },
            include: {
              contact: true,
              connection: true,
            }
          });
          if (msg) {
            // Solo emitir eventos para mensajes enviados por el usuario
            if (msg.fromMe) {
              const io = getIO();
              console.log('[Socket][emit] messageUpdated (fromMe):', msg);
              
              // Emitir a la sala específica de la empresa
              const companyRoom = `company-${msg.connection.companyId}`;
              io.to(companyRoom).emit('messageUpdated', msg);
              console.log(`[Socket][emit] Evento enviado a sala: ${companyRoom}`);
            } else {
              console.log('[Socket][emit] Ignorando actualización de mensaje recibido:', msg.id);
            }
          }
        } else {
          console.log(`⚠️ [WARNING] No se pudo actualizar el mensaje con ID: ${id} - no encontrado en BD`);
        }
      }
    }
  });

  sessions[connectionId] = sock;
  connectionStates[connectionId] = 'connecting';
    
    // Liberar bloqueo después de un tiempo
    setTimeout(() => {
      delete connectionLocks[connectionId];
    }, 5000);
    
  return sock;
  } catch (error) {
    console.error(`Error iniciando sesión ${connectionId}:`, error);
    cleanupConnection(connectionId);
    throw error;
  }
};

export const sendMessage = async (connectionId: string, number: string, message: string) => {
  const session = sessions[connectionId];
  
  if (!session) {
    throw new Error('No hay sesión activa para esta conexión');
  }

  if (connectionStates[connectionId] !== 'open') {
    throw new Error('La conexión no está activa. Por favor, reconecta la sesión de WhatsApp.');
  }

  // Formatear el número de teléfono
  let formattedNumber = number.replace(/\D/g, ''); // Remover caracteres no numéricos
  
  // Manejar códigos de país específicos
  if (formattedNumber.startsWith('54')) {
    // Argentina - ya tiene el código correcto
    formattedNumber = formattedNumber;
  } else if (formattedNumber.startsWith('52')) {
    // México - ya tiene el código correcto
    formattedNumber = formattedNumber;
  } else if (formattedNumber.startsWith('57')) {
    // Colombia - ya tiene el código correcto
    formattedNumber = formattedNumber;
  } else if (formattedNumber.startsWith('1')) {
    // Estados Unidos/Canadá - ya tiene el código correcto
    formattedNumber = formattedNumber;
  } else {
    // Para otros países, intentar detectar el código de país
    // Si el número tiene 9-10 dígitos, probablemente necesita código de país
    if (formattedNumber.length >= 9 && formattedNumber.length <= 10) {
      // Asumir que es un número local sin código de país
      // En este caso, no agregamos código por defecto para evitar errores
      console.log(`Número sin código de país detectado: ${formattedNumber}. Por favor, incluye el código de país (+54 para Argentina)`);
    }
  }
  
  const jid = `${formattedNumber}@s.whatsapp.net`;

  try {
    // Intentar verificar si el número existe en WhatsApp (opcional)
    try {
    const registeredNumbers = await session.onWhatsApp(jid);
    
    if (!registeredNumbers || registeredNumbers.length === 0 || !registeredNumbers[0] || !registeredNumbers[0].exists) {
        console.log(`Advertencia: El número ${number} (${jid}) no parece estar registrado en WhatsApp, pero intentaremos enviar el mensaje de todas formas`);
      }
    } catch (validationError) {
      console.log(`No se pudo validar el número ${number} en WhatsApp, continuando con el envío:`, validationError);
    }

    // Enviar el mensaje
    const sentMessage = await session.sendMessage(jid, { text: message });
    
    if (!sentMessage) {
      throw new Error('Error enviando mensaje');
    }
    
    console.log(`🔍 [DEBUG] sentMessage completo:`, JSON.stringify(sentMessage, null, 2));
    console.log(`🔍 [DEBUG] sentMessage.key:`, sentMessage?.key);
    console.log(`🔍 [DEBUG] sentMessage.key.id:`, sentMessage?.key?.id);
    console.log(`Mensaje enviado exitosamente a ${number} (${jid}) desde conexión ${connectionId}`);
    
    return sentMessage; // <-- Retornar el objeto completo
  } catch (error) {
    console.error(`Error enviando mensaje a ${number} (${jid}):`, error);
    throw new Error(`Error enviando mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

export const getConnectionStatus = (connectionId: string): string => {
  return connectionStates[connectionId] || 'disconnected';
};

export const isConnectionActive = (connectionId: string): boolean => {
  return !!(sessions[connectionId] && connectionStates[connectionId] === 'open');
};

export const disconnectSession = async (connectionId: string) => {
  if (sessions[connectionId]) {
    try {
      await sessions[connectionId].logout();
      logger.info(`Sesión ${connectionId} desconectada por el usuario.`);
    } catch (error) {
      logger.error(`Error al desconectar la sesión ${connectionId}:`, error);
    } finally {
      cleanupConnection(connectionId);
      await connectionService.updateStatus(connectionId, 'DISCONNECTED');
    }
  }
};

export const setupWhatsApp = async (): Promise<void> => {
  await restoreSessions();
};

// Función para sincronizar historial de mensajes
const syncMessageHistory = async (sock: WASocket, connectionId: string) => {
  try {
    console.log(`🔄 [SYNC] Sincronizando historial de mensajes para conexión: ${connectionId}`);
    
    // Obtener conversaciones de la última semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Por ahora, solo logueamos que la sincronización está disponible
    // En una implementación completa, aquí cargaríamos los mensajes desde Baileys
    console.log(`🔄 [SYNC] Historial de la última semana disponible para sincronización`);
    console.log(`🔄 [SYNC] Fecha de inicio: ${oneWeekAgo.toISOString()}`);
    console.log(`🔄 [SYNC] Socket disponible: ${sock ? 'Sí' : 'No'}`);
    
    // TODO: Implementar carga de mensajes desde Baileys
    // Esto requeriría acceso a los métodos de store de Baileys
    // sock.store.loadMessages(remoteJid, limit, cursor)
    
  } catch (error) {
    console.error(`❌ [SYNC] Error en sincronización de historial:`, error);
  }
};

// Función para crear mensaje sincronizado básico
const createSyncedMessage = async (messageId: string, remoteJid: string | undefined, status: string, connectionId: string, content: string = '[Mensaje sincronizado]') => {
  try {
    if (!remoteJid) {
      console.log(`⚠️ [SYNC] remoteJid es undefined para mensaje ${messageId}`);
      return null;
    }
    
    const contactNumber = remoteJid.split('@')[0];
    if (!contactNumber) {
      console.log(`⚠️ [SYNC] No se pudo extraer número de contacto de ${remoteJid}`);
      return null;
    }
    const normalizedNumber = normalizeNumber(contactNumber);
    
    // Primero obtener la conexión para obtener el companyId correcto
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: { company: true }
    });
    
    if (!connection) {
      console.log(`⚠️ [SYNC] Conexión no encontrada: ${connectionId}`);
      return null;
    }
    
    console.log(`🔄 [SYNC] Usando companyId: ${connection.companyId}`);
    console.log(`🔄 [SYNC] Número original: ${contactNumber}, Normalizado: ${normalizedNumber}`);
    
    // Buscar contacto con diferentes variaciones del número
    let contact = await prisma.contact.findFirst({
      where: {
        companyId: connection.companyId,
        OR: [
          { number: normalizedNumber },
          { number: contactNumber },
          { number: `+${contactNumber}` },
          { number: contactNumber.replace('+', '') },
          { number: { endsWith: contactNumber.slice(-8) } }
        ]
      }
    });
    
    // Si existe un contacto sin nombre con este número, lo borramos
    const anonContact = await prisma.contact.findFirst({
      where: {
        companyId: connection.companyId,
        number: normalizedNumber,
        name: ''
      }
    });
    if (anonContact && contact && anonContact.id !== contact.id) {
      await prisma.contact.delete({ where: { id: anonContact.id } });
      console.log(`🗑️ [SYNC] Contacto anónimo borrado: ${anonContact.number}`);
    }
    
    console.log(`🔄 [SYNC] Contacto encontrado:`, contact ? contact.name : 'No encontrado');
    
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: normalizedNumber,
          number: normalizedNumber,
          companyId: connection.companyId,
        },
      });
      console.log(`🔄 [SYNC] Contacto creado:`, contact);
    }
    
    // Buscar o crear conversación
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id, connectionId: connectionId },
    });
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          connectionId: connectionId,
          unreadCount: 0,
        },
      });
      console.log(`🔄 [SYNC] Conversación creada:`, conversation);
    }
    
    // Crear el mensaje en la BD
    const newMessage = await prisma.message.create({
      data: {
        id: messageId,
        content: content,
        fromMe: true,
        status: status,
        timestamp: new Date(),
        contactId: contact.id,
        conversationId: conversation.id,
        connectionId: connectionId,
      },
      include: {
        contact: true,
        connection: true,
      },
    });
    
    console.log(`🔄 [SYNC] Mensaje sincronizado:`, newMessage);
    return newMessage;
    
  } catch (error) {
    console.error(`❌ [SYNC] Error creando mensaje sincronizado:`, error);
    return null;
  }
};