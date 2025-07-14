import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear empresa de prueba
  const company = await prisma.company.upsert({
    where: { id: 'company-test-001' },
    update: {},
    create: {
      id: 'company-test-001',
      name: 'Flame AI CRM Demo',
      plan: 'pro',
      status: 'active',
      dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      recurrence: 'yearly',
    },
  });

  console.log('✅ Empresa creada:', company.name);

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@flameai.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@flameai.com',
      password: hashedPassword,
      profile: 'admin',
      isActive: true,
      isOnline: false,
      companyId: company.id,
    },
  });

  console.log('✅ Usuario admin creado:', adminUser.email);

  // Crear usuario de prueba
  const testUser = await prisma.user.upsert({
    where: { email: 'user@flameai.com' },
    update: {},
    create: {
      name: 'Usuario Demo',
      email: 'user@flameai.com',
      password: hashedPassword,
      profile: 'user',
      isActive: true,
      isOnline: false,
      companyId: company.id,
    },
  });

  console.log('✅ Usuario de prueba creado:', testUser.email);

  // Crear conexión de prueba
  const connection = await prisma.connection.upsert({
    where: { id: 'connection-test-001' },
    update: {},
    create: {
      id: 'connection-test-001',
      name: 'WhatsApp Principal',
      type: 'whatsapp_web',
      status: 'DISCONNECTED',
      session: 'whatsapp-session-001',
      isDefault: true,
      isActive: true,
      companyId: company.id,
    },
  });

  console.log('✅ Conexión de prueba creada:', connection.name);

  // Crear contactos de prueba
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { id: 'contact-001' },
      update: {},
      create: {
        id: 'contact-001',
        name: 'María González',
        number: '5491112345678',
        email: 'maria@example.com',
        companyName: 'Empresa ABC',
        position: 'Gerente',
        companyId: company.id,
      },
    }),
    prisma.contact.upsert({
      where: { id: 'contact-002' },
      update: {},
      create: {
        id: 'contact-002',
        name: 'Carlos López',
        number: '5491187654321',
        email: 'carlos@example.com',
        companyName: 'Empresa XYZ',
        position: 'Director',
        companyId: company.id,
      },
    }),
    prisma.contact.upsert({
      where: { id: 'contact-003' },
      update: {},
      create: {
        id: 'contact-003',
        name: 'Ana Silva',
        number: '5491198765432',
        email: 'ana@example.com',
        companyName: 'Startup Tech',
        position: 'CEO',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Contactos de prueba creados:', contacts.length);

  // Crear cola de atención
  const queue = await prisma.queue.upsert({
    where: { id: 'queue-001' },
    update: {},
    create: {
      id: 'queue-001',
      name: 'Atención General',
      color: '#25D366',
      greetingMessage: '¡Hola! Gracias por contactarnos. Un agente te atenderá pronto.',
      companyId: company.id,
    },
  });

  console.log('✅ Cola de atención creada:', queue.name);

  // Crear etiquetas con el nuevo formato Atributo-Valor
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { attribute_value_companyId: { attribute: 'Prioridad', value: 'Alta', companyId: company.id } },
      update: {},
      create: {
        attribute: 'Prioridad',
        value: 'Alta',
        color: '#DC3545',
        companyId: company.id,
      },
    }),
    prisma.tag.upsert({
      where: { attribute_value_companyId: { attribute: 'Prioridad', value: 'Media', companyId: company.id } },
      update: {},
      create: {
        attribute: 'Prioridad',
        value: 'Media',
        color: '#FFC107',
        companyId: company.id,
      },
    }),
    prisma.tag.upsert({
      where: { attribute_value_companyId: { attribute: 'Tipo', value: 'Soporte Técnico', companyId: company.id } },
      update: {},
      create: {
        attribute: 'Tipo',
        value: 'Soporte Técnico',
        color: '#007BFF',
        companyId: company.id,
      },
    }),
    prisma.tag.upsert({
      where: { attribute_value_companyId: { attribute: 'Tipo', value: 'Ventas', companyId: company.id } },
      update: {},
      create: {
        attribute: 'Tipo',
        value: 'Ventas',
        color: '#28A745',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Etiquetas creadas:', tags.length);

  // Crear tickets de ejemplo
  const tickets = await Promise.all([
    prisma.ticket.upsert({
      where: { id: 'ticket-001' },
      update: {},
      create: {
        id: 'ticket-001',
        status: 'open',
        priority: 'high',
        subject: 'Problema con el pago',
        lastMessage: 'No puedo completar mi compra',
        unreadMessages: 3,
        kanbanColumn: 'todo',
        kanbanOrder: 1,
        contactId: contacts[0].id,
        connectionId: connection.id,
        userId: adminUser.id,
        queueId: queue.id,
      },
    }),
    prisma.ticket.upsert({
      where: { id: 'ticket-002' },
      update: {},
      create: {
        id: 'ticket-002',
        status: 'pending',
        priority: 'medium',
        subject: 'Consulta sobre envío',
        lastMessage: '¿Cuándo llegará mi pedido?',
        unreadMessages: 0,
        kanbanColumn: 'in-progress',
        kanbanOrder: 1,
        contactId: contacts[1].id,
        connectionId: connection.id,
        userId: testUser.id,
        queueId: queue.id,
      },
    }),
    prisma.ticket.upsert({
      where: { id: 'ticket-003' },
      update: {},
      create: {
        id: 'ticket-003',
        status: 'closed',
        priority: 'low',
        subject: 'Información general',
        lastMessage: 'Gracias por la información',
        unreadMessages: 0,
        kanbanColumn: 'done',
        kanbanOrder: 1,
        contactId: contacts[2].id,
        connectionId: connection.id,
        userId: adminUser.id,
        queueId: queue.id,
      },
    }),
  ]);

  console.log('✅ Tickets de ejemplo creados:', tickets.length);

  // Crear una conversación para el primer ticket y añadir mensajes
  if (tickets.length > 0) {
    const firstTicket = tickets[0];

    // 1. Crear o actualizar la conversación
    const conversation = await prisma.conversation.upsert({
      where: { id: `conv-ticket-${firstTicket.id}` },
      update: {},
      create: {
        id: `conv-ticket-${firstTicket.id}`,
        contactId: firstTicket.contactId,
        connectionId: firstTicket.connectionId,
        userId: firstTicket.userId,
        unreadCount: 3,
      },
    });

    console.log('✅ Conversación creada/actualizada para el ticket:', firstTicket.id);

    // 2. Crear mensajes para esa conversación (solo si es nueva)
    const existingMessages = await prisma.message.count({
      where: { conversationId: conversation.id },
    });

    if (existingMessages === 0) {
      await prisma.message.create({
        data: {
          content: 'Hola, tengo un problema con mi pago',
          fromMe: false,
          status: 'read',
          conversationId: conversation.id,
          ticketId: firstTicket.id,
          contactId: firstTicket.contactId,
          connectionId: firstTicket.connectionId,
        },
      });

      await prisma.message.create({
        data: {
          content: 'Hola María, te ayudo con eso. ¿Podrías darme más detalles?',
          fromMe: true,
          status: 'read',
          conversationId: conversation.id,
          ticketId: firstTicket.id,
          contactId: firstTicket.contactId,
          connectionId: firstTicket.connectionId,
          userId: firstTicket.userId,
        },
      });

      const message3 = await prisma.message.create({
        data: {
          content: 'Sí, el sistema no acepta mi tarjeta.',
          fromMe: false,
          status: 'read',
          conversationId: conversation.id,
          ticketId: firstTicket.id,
          contactId: firstTicket.contactId,
          connectionId: firstTicket.connectionId,
        },
      });

      console.log('✅ Mensajes de ejemplo creados:', 3);

      // 3. Actualizar la conversación con el último mensaje
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageId: message3.id },
      });

      console.log('✅ Conversación actualizada con el último mensaje.');
    }
  }

  // Las etiquetas ya se crearon arriba. Este bloque es redundante y ha sido comentado.
  /*
  await prisma.tag.create({
    data: {
      attribute: 'General',
      value: 'Soporte',
      color: '#007BFF',
      companyId: company.id,
    },
  });
  await prisma.tag.create({
    data: {
      attribute: 'General',
      value: 'Ventas',
      color: '#28A745',
      companyId: company.id,
    },
  });
  await prisma.tag.create({
    data: {
      attribute: 'Prioridad',
      value: 'Alta',
      color: '#DC3545',
      companyId: company.id,
    },
  });
  */

  console.log('🌱 Seed de la base de datos completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 