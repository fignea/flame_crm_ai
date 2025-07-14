// @ts-ignore
// eslint-disable-next-line
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  // Buscar empresa y conexión por defecto
  const company = await prisma.company.findFirst();
  const connection = await prisma.connection.findFirst();
  if (!company || !connection) {
    throw new Error('No hay empresa o conexión en la base de datos');
  }

  // Contacto "yo mismo"
  const myContact = await prisma.contact.upsert({
    where: { number_companyId: { number: '+5491124557946', companyId: company.id } },
    update: {},
    create: {
      name: 'Mi número',
      number: '+5491124557946',
      companyId: company.id
    }
  });

  // Crear conversación conmigo mismo
  await prisma.conversation.upsert({
    where: { contactId_connectionId: { contactId: myContact.id, connectionId: connection.id } },
    update: {},
    create: {
      contactId: myContact.id,
      connectionId: connection.id,
      messages: {
        create: [
          {
            content: '¡Hola! Esta es una conversación de prueba contigo mismo.',
            fromMe: true,
            status: 'read',
            contactId: myContact.id,
            connectionId: connection.id
          },
          {
            content: '¡Gracias! Confirmo que funciona.',
            fromMe: false,
            status: 'read',
            contactId: myContact.id,
            connectionId: connection.id
          }
        ]
      }
    }
  });

  // Contactos y conversaciones de prueba
  const demoContacts = [
    { name: 'Juan Pérez', number: '+5491111111111' },
    { name: 'María Gómez', number: '+5491122222222' },
    { name: 'Empresa XYZ', number: '+5491133333333' }
  ];

  for (const c of demoContacts) {
    const contact = await prisma.contact.upsert({
      where: { number_companyId: { number: c.number, companyId: company.id } },
      update: {},
      create: {
        name: c.name,
        number: c.number,
        companyId: company.id
      }
    });
    await prisma.conversation.upsert({
      where: { contactId_connectionId: { contactId: contact.id, connectionId: connection.id } },
      update: {},
      create: {
        contactId: contact.id,
        connectionId: connection.id,
        messages: {
          create: [
            {
              content: `Hola ${c.name}, este es un mensaje de prueba.`,
              fromMe: true,
              status: 'read',
              contactId: contact.id,
              connectionId: connection.id
            },
            {
              content: `¡Hola! Recibido, gracias.`,
              fromMe: false,
              status: 'read',
              contactId: contact.id,
              connectionId: connection.id
            }
          ]
        }
      }
    });
  }

  console.log('Conversaciones y mensajes de prueba creados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 