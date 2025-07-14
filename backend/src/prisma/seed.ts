import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando el proceso de seed...');

  // 1. Encontrar o crear la compañía por defecto
  let company = await prisma.company.findFirst({
    where: { name: 'Default Company' },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Default Company',
        plan: 'pro',
      },
    });
    console.log(`🏢 Compañía creada: ${company.name}`);
  } else {
    console.log(`🏢 Compañía encontrada: ${company.name}`);
  }

  // 2. Hashear la contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  console.log('🔒 Contraseña hasheada.');

  // 3. Crear el usuario administrador
  await prisma.user.upsert({
    where: { email: 'admin@flameai.com' },
    update: { password: hashedPassword },
    create: {
      name: 'Admin',
      email: 'admin@flameai.com',
      password: hashedPassword,
      profile: 'admin',
      companyId: company.id,
    },
  });
  console.log(`👤 Usuario administrador creado/actualizado: admin@flameai.com`);
  
  console.log('✅ Proceso de seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 