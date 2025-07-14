/* eslint-disable no-console */
import { PrismaClient, Contact } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando proceso de deduplicación de contactos...');

  const allContacts = await prisma.contact.findMany();
  const contactsByCompany = new Map<string, Contact[]>();

  for (const contact of allContacts) {
    if (contact.companyId) {
      if (!contactsByCompany.has(contact.companyId)) {
        contactsByCompany.set(contact.companyId, []);
      }
      contactsByCompany.get(contact.companyId)!.push(contact);
    }
  }

  for (const [companyId, contacts] of contactsByCompany.entries()) {
    console.log(`\nProcesando empresa: ${companyId}`);
    const normalizedContacts = new Map<string, Contact[]>();

    for (const contact of contacts) {
      const normalizedNumber = contact.number.replace(/\D/g, '');
      if (!normalizedContacts.has(normalizedNumber)) {
        normalizedContacts.set(normalizedNumber, []);
      }
      normalizedContacts.get(normalizedNumber)!.push(contact);
    }

    for (const [normalizedNumber, duplicateContacts] of normalizedContacts.entries()) {
      if (duplicateContacts.length > 1) {
        console.log(`  Encontrado duplicado para el número ${normalizedNumber}: ${duplicateContacts.length} contactos.`);

        // 1. Ordenar para elegir el contacto principal (master)
        // Criterio: el que tenga `+` o el más antiguo.
        duplicateContacts.sort((a: Contact, b: Contact) => {
          const aHasPlus = a.number.startsWith('+');
          const bHasPlus = b.number.startsWith('+');
          if (aHasPlus && !bHasPlus) return -1;
          if (!aHasPlus && bHasPlus) return 1;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

        const masterContact = duplicateContacts.shift()!;
        console.log(`    Contacto principal elegido: ${masterContact.id} (${masterContact.number})`);

        // 2. Fusionar datos de los duplicados en el principal
        for (const duplicate of duplicateContacts) {
          console.log(`    Fusionando desde duplicado: ${duplicate.id} (${duplicate.number})`);

          // Re-asociar mensajes
          await prisma.message.updateMany({
            where: { contactId: duplicate.id },
            data: { contactId: masterContact.id },
          });

          // Re-asociar tickets
          await prisma.ticket.updateMany({
            where: { contactId: duplicate.id },
            data: { contactId: masterContact.id },
          });

          // Re-asociar conversaciones
          await prisma.conversation.updateMany({
            where: { contactId: duplicate.id },
            data: { contactId: masterContact.id },
          });

          // Re-asociar tags
          const duplicateContactWithTags = await prisma.contact.findUnique({
            where: { id: duplicate.id },
            include: { tags: true },
          });
          const masterContactWithTags = await prisma.contact.findUnique({
            where: { id: masterContact.id },
            include: { tags: true },
          });

          if (duplicateContactWithTags && masterContactWithTags) {
            const masterTagIds = new Set(masterContactWithTags.tags.map((t: any) => t.id));
            const tagsToConnect = duplicateContactWithTags.tags
              .filter((t: any) => !masterTagIds.has(t.id))
              .map((t: any) => ({ id: t.id }));

            if (tagsToConnect.length > 0) {
              await prisma.contact.update({
                where: { id: masterContact.id },
                data: {
                  tags: {
                    connect: tagsToConnect,
                  },
                },
              });
            }
          }

          // 3. Eliminar el contacto duplicado
          await prisma.contact.delete({ where: { id: duplicate.id } });
          console.log(`    Contacto duplicado ${duplicate.id} eliminado.`);
        }

        // 4. Asegurarse que el número del master está normalizado con '+'
        const masterNumberNormalized = `+${masterContact.number.replace(/\D/g, '')}`;
        if (masterContact.number !== masterNumberNormalized) {
          await prisma.contact.update({
            where: { id: masterContact.id },
            data: { number: masterNumberNormalized },
          });
          console.log(`    Número de contacto principal actualizado a ${masterNumberNormalized}`);
        }
      }
    }
  }

  console.log('\nProceso de deduplicación completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 