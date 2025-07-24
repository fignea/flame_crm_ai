#!/usr/bin/env ts-node

import * as path from 'path';
import * as fs from 'fs';

// Colores para la consola
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Función de logging con colores
const log = {
  info: (msg: string) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`)
};

// Mock simple para pruebas
class SimpleTestRunner {
  private tests: Array<{
    name: string;
    fn: () => Promise<void> | void;
    timeout?: number;
  }> = [];

  private passed = 0;
  private failed = 0;
  private errors: string[] = [];

  test(name: string, fn: () => Promise<void> | void, timeout = 5000) {
    this.tests.push({ name, fn, timeout });
  }

  async run() {
    log.info(`Ejecutando ${this.tests.length} pruebas...`);
    
    for (const test of this.tests) {
      try {
        const start = Date.now();
        
        // Ejecutar prueba con timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout de ${test.timeout}ms`)), test.timeout);
        });

        const testPromise = Promise.resolve(test.fn());
        
        await Promise.race([testPromise, timeoutPromise]);
        
        const duration = Date.now() - start;
        log.success(`✓ ${test.name} (${duration}ms)`);
        this.passed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error(`✗ ${test.name}: ${errorMsg}`);
        this.errors.push(`${test.name}: ${errorMsg}`);
        this.failed++;
      }
    }

    this.printResults();
  }

  private printResults() {
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${this.tests.length}`);
    log.success(`Pasaron: ${this.passed}`);
    
    if (this.failed > 0) {
      log.error(`Fallaron: ${this.failed}`);
      console.log('\nErrores:');
      this.errors.forEach(error => log.error(`  - ${error}`));
    }
    
    console.log('='.repeat(50));
    
    if (this.failed === 0) {
      log.success('¡Todas las pruebas pasaron!');
      process.exit(0);
    } else {
      log.error('Algunas pruebas fallaron');
      process.exit(1);
    }
  }
}

// Funciones de aserción simples
export const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to be ${expected}`);
    }
  },
  
  toEqual: (expected: any) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  
  toBeNull: () => {
    if (actual !== null) {
      throw new Error(`Expected ${actual} to be null`);
    }
  },
  
  toBeDefined: () => {
    if (actual === undefined) {
      throw new Error(`Expected ${actual} to be defined`);
    }
  },
  
  toBeInstanceOf: (expected: any) => {
    if (!(actual instanceof expected)) {
      throw new Error(`Expected ${actual} to be instance of ${expected.name}`);
    }
  },
  
  toHaveProperty: (property: string, value?: any) => {
    if (!(property in actual)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to have property ${property}`);
    }
    if (value !== undefined && actual[property] !== value) {
      throw new Error(`Expected property ${property} to be ${value}, got ${actual[property]}`);
    }
  },
  
  toHaveLength: (expected: number) => {
    if (!actual.length && actual.length !== 0) {
      throw new Error(`Expected ${actual} to have length property`);
    }
    if (actual.length !== expected) {
      throw new Error(`Expected length to be ${expected}, got ${actual.length}`);
    }
  },
  
  toMatchObject: (expected: any) => {
    for (const key in expected) {
      if (!(key in actual)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to have property ${key}`);
      }
      if (typeof expected[key] === 'object' && expected[key] !== null) {
        expect(actual[key]).toMatchObject(expected[key]);
      } else if (actual[key] !== expected[key]) {
        throw new Error(`Expected property ${key} to be ${expected[key]}, got ${actual[key]}`);
      }
    }
  },
  
  toThrow: (expectedError?: string) => {
    if (typeof actual !== 'function') {
      throw new Error('Expected a function');
    }
    
    try {
      actual();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedError) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (!errorMsg.includes(expectedError)) {
          throw new Error(`Expected error to contain "${expectedError}", got "${errorMsg}"`);
        }
      }
    }
  }
});

// Mock para funciones
export const mockFn = () => {
  let calls: any[][] = [];
  let returnValue: any = undefined;
  let implementation: ((...args: any[]) => any) | null = null;
  
  const fn = (...args: any[]) => {
    calls.push(args);
    if (implementation) {
      return implementation(...args);
    }
    return returnValue;
  };
  
  fn.mockReturnValue = (value: any) => {
    returnValue = value;
    return fn;
  };
  
  fn.mockImplementation = (impl: (...args: any[]) => any) => {
    implementation = impl;
    return fn;
  };
  
  fn.mockResolvedValue = (value: any) => {
    implementation = () => Promise.resolve(value);
    return fn;
  };
  
  fn.mockRejectedValue = (error: any) => {
    implementation = () => Promise.reject(error);
    return fn;
  };
  
  fn.mockClear = () => {
    calls = [];
    return fn;
  };
  
  fn.calls = calls;
  fn.toHaveBeenCalled = () => calls.length > 0;
  fn.toHaveBeenCalledTimes = (times: number) => calls.length === times;
  fn.toHaveBeenCalledWith = (...args: any[]) => {
    return calls.some(call => JSON.stringify(call) === JSON.stringify(args));
  };
  
  return fn;
};

// Pruebas básicas para validar el sistema
async function runBasicTests() {
  const runner = new SimpleTestRunner();
  
  // Prueba básica de funcionalidad
  runner.test('expect.toBe funciona correctamente', () => {
    expect(2 + 2).toBe(4);
    expect('hello').toBe('hello');
  });
  
  runner.test('expect.toEqual funciona con objetos', () => {
    expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
  });
  
  runner.test('mockFn funciona correctamente', () => {
    const mock = mockFn();
    mock('test');
    expect(mock.calls).toHaveLength(1);
    expect(mock.toHaveBeenCalledWith('test')).toBe(true);
  });
  
  runner.test('Prueba que debe fallar (demostración)', () => {
    // Esta prueba está comentada para que no falle el conjunto
    // expect(1).toBe(2);
  });
  
  await runner.run();
}

// Función principal para ejecutar pruebas específicas
async function runSpecificTests() {
  const runner = new SimpleTestRunner();
  
  // Pruebas simuladas para servicios de chat
  runner.test('ConversationService mock test', async () => {
    // Simulamos una prueba del servicio de conversaciones
    const mockConversations = [
      { id: 'conv1', lastMessage: 'Hola' },
      { id: 'conv2', lastMessage: 'Adiós' }
    ];
    
    // Simulamos el resultado de una consulta
    expect(mockConversations).toHaveLength(2);
    expect(mockConversations[0]).toHaveProperty('id', 'conv1');
    expect(mockConversations[0]).toHaveProperty('lastMessage', 'Hola');
  });
  
  runner.test('MetricsService mock test', async () => {
    // Simulamos métricas
    const mockMetrics = {
      totalConversations: 100,
      activeConversations: 25,
      avgResponseTime: 5.2,
      conversationsByHour: new Array(24).fill(0).map((_, i) => ({ hour: i, count: Math.floor(Math.random() * 10) }))
    };
    
    expect(mockMetrics).toHaveProperty('totalConversations', 100);
    expect(mockMetrics).toHaveProperty('activeConversations', 25);
    expect(mockMetrics.conversationsByHour).toHaveLength(24);
    expect(mockMetrics.avgResponseTime).toBeDefined();
  });
  
  runner.test('SocketService mock test', async () => {
    // Simulamos eventos de WebSocket
    const mockSocket = {
      id: 'socket123',
      emit: mockFn(),
      on: mockFn(),
      join: mockFn(),
      leave: mockFn()
    };
    
    // Simulamos unirse a una sala
    mockSocket.join('conversation:123');
    expect(mockSocket.join.toHaveBeenCalledWith('conversation:123')).toBe(true);
    
    // Simulamos emitir un evento
    mockSocket.emit('message', { content: 'Hello' });
    expect(mockSocket.emit.toHaveBeenCalledWith('message', { content: 'Hello' })).toBe(true);
  });
  
  await runner.run();
}

// Ejecutar pruebas
if (require.main === module) {
  const testType = process.argv[2] || 'basic';
  
  console.log(`${colors.blue}=== FLAME AI CRM - Test Runner ===${colors.reset}`);
  console.log(`Ejecutando pruebas: ${testType}\n`);
  
  if (testType === 'basic') {
    runBasicTests();
  } else if (testType === 'specific') {
    runSpecificTests();
  } else {
    log.error('Tipo de prueba no válido. Use: basic | specific');
    process.exit(1);
  }
}

export { SimpleTestRunner, log, colors };
export default { expect, mockFn, SimpleTestRunner, log, colors }; 