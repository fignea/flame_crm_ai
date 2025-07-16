import { beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Conectar a la base de datos de prueba
  await prisma.$connect();
  
  // Crear empresa de prueba por defecto si no existe
  const existingCompany = await prisma.company.findFirst({
    where: { name: 'Test Company' },
  });
  
  if (!existingCompany) {
    await prisma.company.create({
      data: {
        name: 'Test Company',
        status: 'active',
        plan: 'basic',
      },
    });
  }
});

afterAll(async () => {
  // Limpiar base de datos después de todas las pruebas
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  
  // Cerrar conexión
  await prisma.$disconnect();
});

// Configurar timeout global para pruebas
jest.setTimeout(30000);

// Mock de console.log para pruebas más limpias
const originalConsoleLog = console.log;
console.log = (...args) => {
  if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
    return;
  }
  originalConsoleLog(...args);
}; 