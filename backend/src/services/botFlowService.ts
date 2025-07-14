import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

export interface CreateBotFlowData {
  name: string;
  description?: string;
  connectionId: string;
  companyId: string;
  isActive?: boolean;
  priority?: number;
  alwaysRespond?: boolean;
  stopOnMatch?: boolean;
}

export interface CreateBotConditionData {
  name: string;
  type: 'exact_match' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'menu_option';
  value: string;
  operator?: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  caseSensitive?: boolean;
  regexFlags?: string;
}

export interface CreateBotResponseData {
  message: string;
  responseType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  mediaUrl?: string;
  mediaCaption?: string;
  delay?: number;
  order?: number;
}

export class BotFlowService {
  // Crear un nuevo flujo de bot
  static async createFlow(data: CreateBotFlowData) {
    try {
      const flow = await prisma.botFlow.create({
        data: {
          name: data.name,
          description: data.description || null,
          connectionId: data.connectionId,
          companyId: data.companyId,
          isActive: data.isActive ?? true,
          priority: data.priority ?? 0,
          alwaysRespond: data.alwaysRespond ?? false,
          stopOnMatch: data.stopOnMatch ?? true,
        },
        include: {
          conditions: {
            include: {
              responses: true,
            },
          },
        },
      });

      logger.info(`Flujo de bot creado: ${flow.name}`);
      return flow;
    } catch (error) {
      logger.error('Error creando flujo de bot:', error);
      throw error;
    }
  }

  // Obtener todos los flujos de una conexión
  static async getFlowsByConnection(connectionId: string) {
    try {
      const flows = await prisma.botFlow.findMany({
        where: {
          connectionId,
          isActive: true,
        },
        include: {
          conditions: {
            include: {
              responses: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          priority: 'desc',
        },
      });

      return flows;
    } catch (error) {
      logger.error('Error obteniendo flujos de bot:', error);
      throw error;
    }
  }

  // Obtener todos los flujos de una empresa
  static async getFlowsByCompany(companyId: string) {
    try {
      const flows = await prisma.botFlow.findMany({
        where: {
          companyId,
        },
        include: {
          connection: {
            select: {
              name: true,
              type: true,
              status: true,
            },
          },
          conditions: {
            include: {
              responses: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
        orderBy: [
          { isActive: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return flows;
    } catch (error) {
      logger.error('Error obteniendo flujos de bot por empresa:', error);
      throw error;
    }
  }

  // Obtener un flujo específico
  static async getFlowById(flowId: string) {
    try {
      const flow = await prisma.botFlow.findUnique({
        where: { id: flowId },
        include: {
          conditions: {
            include: {
              responses: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
      });

      return flow;
    } catch (error) {
      logger.error('Error obteniendo flujo de bot:', error);
      throw error;
    }
  }

  // Actualizar un flujo
  static async updateFlow(flowId: string, data: Partial<CreateBotFlowData>) {
    try {
      const flow = await prisma.botFlow.update({
        where: { id: flowId },
        data,
        include: {
          conditions: {
            include: {
              responses: true,
            },
          },
        },
      });

      logger.info(`Flujo de bot actualizado: ${flow.name}`);
      return flow;
    } catch (error) {
      logger.error('Error actualizando flujo de bot:', error);
      throw error;
    }
  }

  // Eliminar un flujo
  static async deleteFlow(flowId: string) {
    try {
      await prisma.botFlow.delete({
        where: { id: flowId },
      });

      logger.info(`Flujo de bot eliminado: ${flowId}`);
    } catch (error) {
      logger.error('Error eliminando flujo de bot:', error);
      throw error;
    }
  }

  // Agregar una condición a un flujo
  static async addCondition(flowId: string, data: CreateBotConditionData) {
    try {
      const condition = await prisma.botCondition.create({
        data: {
          name: data.name,
          type: data.type,
          value: data.value,
          operator: data.operator ?? 'equals',
          caseSensitive: data.caseSensitive ?? false,
          regexFlags: data.regexFlags || null,
          flowId,
        },
        include: {
          responses: true,
        },
      });

      logger.info(`Condición agregada al flujo: ${condition.name}`);
      return condition;
    } catch (error) {
      logger.error('Error agregando condición:', error);
      throw error;
    }
  }

  // Agregar una respuesta a una condición
  static async addResponse(conditionId: string, data: CreateBotResponseData) {
    try {
      const response = await prisma.botResponse.create({
        data: {
          message: data.message,
          responseType: data.responseType ?? 'text',
          mediaUrl: data.mediaUrl || null,
          mediaCaption: data.mediaCaption || null,
          delay: data.delay ?? 0,
          order: data.order ?? 0,
          conditionId,
        },
      });

      logger.info(`Respuesta agregada a la condición: ${response.message}`);
      return response;
    } catch (error) {
      logger.error('Error agregando respuesta:', error);
      throw error;
    }
  }

  // Procesar un mensaje entrante y encontrar respuestas automáticas
  static async processMessage(messageContent: string, connectionId: string, messageId: string) {
    try {
      logger.info(`🔍 [BOT] Procesando mensaje: "${messageContent}" en conexión ${connectionId}`);

      // Obtener todos los flujos activos para esta conexión
      const flows = await this.getFlowsByConnection(connectionId);
      
      if (flows.length === 0) {
        logger.info(`🔍 [BOT] No hay flujos activos para la conexión ${connectionId}`);
        return null;
      }

      let matchedFlow: any = null;
      let matchedCondition: any = null;
      let responsesToSend: any[] = [];

      // Procesar cada flujo en orden de prioridad
      for (const flow of flows) {
        logger.info(`🔍 [BOT] Verificando flujo: ${flow.name}`);

        // Verificar si este flujo debe responder siempre
        if (!flow.alwaysRespond) {
          // Verificar si ya se envió una respuesta automática recientemente
          const recentInteraction = await prisma.botInteraction.findFirst({
            where: {
              messageId,
              flowId: flow.id,
            },
          });

          if (recentInteraction) {
            logger.info(`🔍 [BOT] Flujo ${flow.name} ya procesó este mensaje`);
            continue;
          }
        }

        // Procesar cada condición del flujo
        for (const condition of flow.conditions) {
          const isMatch = this.evaluateCondition(messageContent, condition);
          
          if (isMatch) {
            logger.info(`✅ [BOT] Condición coincidente encontrada: ${condition.name}`);
            
            matchedFlow = flow;
            matchedCondition = condition;
            responsesToSend = condition.responses;

            // Si el flujo debe detenerse al encontrar la primera coincidencia
            if (flow.stopOnMatch) {
              break;
            }
          }
        }

        // Si encontramos una coincidencia y el flujo debe detenerse, salir del bucle
        if (matchedFlow && matchedFlow.stopOnMatch) {
          break;
        }
      }

      // Si encontramos respuestas, registrarlas y retornarlas
      if (matchedFlow && matchedCondition && responsesToSend.length > 0) {
        // Registrar la interacción
        await prisma.botInteraction.create({
          data: {
            messageId,
            flowId: matchedFlow.id,
            conditionId: matchedCondition.id,
            connectionId,
            matched: true,
            responsesSent: responsesToSend.length,
          },
        });

        logger.info(`✅ [BOT] Respuestas encontradas: ${responsesToSend.length} para el flujo ${matchedFlow.name}`);
        return {
          flow: matchedFlow,
          condition: matchedCondition,
          responses: responsesToSend,
        };
      }

      // Registrar que no se encontraron coincidencias
      await prisma.botInteraction.create({
        data: {
          messageId,
          connectionId,
          matched: false,
          responsesSent: 0,
        },
      });

      logger.info(`❌ [BOT] No se encontraron respuestas automáticas para el mensaje`);
      return null;
    } catch (error) {
      logger.error('Error procesando mensaje con bot flows:', error);
      return null;
    }
  }

  // Evaluar si un mensaje coincide con una condición
  private static evaluateCondition(messageContent: string, condition: any): boolean {
    const content = condition.caseSensitive ? messageContent : messageContent.toLowerCase();
    const value = condition.caseSensitive ? condition.value : condition.value.toLowerCase();

    switch (condition.type) {
      case 'exact_match':
        return condition.operator === 'equals' 
          ? content === value 
          : content !== value;

      case 'contains':
        return condition.operator === 'contains' 
          ? content.includes(value)
          : !content.includes(value);

      case 'starts_with':
        return content.startsWith(value);

      case 'ends_with':
        return content.endsWith(value);

      case 'regex':
        try {
          const flags = condition.regexFlags || 'i';
          const regex = new RegExp(value, flags);
          return regex.test(messageContent);
        } catch (error) {
          logger.error('Error en expresión regular:', error);
          return false;
        }

      case 'menu_option':
        // Para opciones de menú, verificar si el mensaje es exactamente el valor
        return content === value;

      default:
        return false;
    }
  }
} 