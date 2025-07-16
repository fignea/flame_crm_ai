/** @type {import('jest').Config} */
module.exports = {
  // Entorno de testing
  testEnvironment: 'node',
  
  // Archivos de configuración
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Patrones de archivos de prueba
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  
  // Transformaciones de archivos
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Extensiones de archivos
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Mapeo de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**',
    '!src/prisma/**'
  ],
  
  // Umbral de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Reportes de cobertura
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Directorio de cobertura
  coverageDirectory: 'coverage',
  
  // Timeout para pruebas
  testTimeout: 30000,
  
  // Variables de entorno para testing
  setupFiles: ['<rootDir>/tests/env.ts'],
  
  // Ignorar archivos
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  
  // Configuración para TypeScript
  preset: 'ts-jest',
  
  // Configuración adicional
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}; 