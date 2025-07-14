const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🔄 Inicializando base de datos...');
    
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');
    
    // Ejecutar migraciones
    console.log('🔄 Ejecutando migraciones...');
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migraciones completadas');
    
    // Generar cliente Prisma
    console.log('🔄 Generando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Cliente Prisma generado');
    
    // Verificar que las tablas existen
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    console.log('📋 Tablas encontradas:', tables.map(t => t.name));
    
    console.log('🎉 Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase(); 