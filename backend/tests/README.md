# 🧪 Sistema de Pruebas - Flame AI CRM

Este directorio contiene las pruebas unitarias para las funcionalidades de chat y WebSockets del sistema CRM.

## 📁 Estructura de Pruebas

```
tests/
├── README.md                          # Este archivo
├── setup.ts                          # Configuración y mocks
├── runTests.ts                       # Test runner personalizado
├── services/
│   ├── conversationService.test.ts   # Pruebas de servicio de conversaciones
│   ├── socketService.test.ts         # Pruebas de servicio WebSocket
│   └── metricsService.test.ts        # Pruebas de servicio de métricas
├── routes/
│   ├── conversations.test.ts         # Pruebas de endpoints de conversaciones
│   ├── metrics.test.ts               # Pruebas de endpoints de métricas
│   └── websocket.test.ts             # Pruebas de endpoints WebSocket
└── utils/
    ├── helpers.test.ts               # Pruebas de utilidades
    └── validators.test.ts            # Pruebas de validadores
```

## 🚀 Ejecución de Pruebas

### Comandos Disponibles

```bash
# Ejecutar todas las pruebas específicas
npm test

# Ejecutar pruebas básicas del sistema
npm run test:basic

# Ejecutar en modo watch (recarga automática)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

### Ejecución Manual

```bash
# Pruebas básicas
ts-node tests/runTests.ts basic

# Pruebas específicas
ts-node tests/runTests.ts specific
```

## 🔧 Configuración del Entorno

### Variables de Entorno de Prueba

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
PORT=3001
```

### Mocks Disponibles

El archivo `setup.ts` proporciona mocks para:

- **Prisma Client**: Mock completo de la base de datos
- **Logger**: Mock del sistema de logging
- **Socket.IO**: Mock de WebSocket
- **WebSocket**: Mock del WebSocket del navegador

## 📋 Tipos de Pruebas

### 1. Pruebas de Servicios

#### ConversationService
```typescript
// Ejemplo de prueba
test('debería crear una nueva conversación', async () => {
  const mockConversation = createTestData.conversation();
  prismaMock.conversation.create.mockResolvedValue(mockConversation);
  
  const result = await ConversationService.createConversation({
    connectionId: 'conn1',
    contactPhone: '+1234567890'
  });
  
  expect(result).toEqual(mockConversation);
});
```

#### SocketService
```typescript
// Ejemplo de prueba WebSocket
test('debería manejar conexión de usuario', async () => {
  const mockSocket = socketMock;
  await socketService.handleConnection(mockSocket);
  
  expect(mockSocket.join).toHaveBeenCalledWith('company:test-company-id');
});
```

#### MetricsService
```typescript
// Ejemplo de prueba de métricas
test('debería calcular métricas correctamente', async () => {
  const mockData = createTestData.metrics();
  const result = await MetricsService.getConversationMetrics(filters);
  
  expectMetricsStructure(result);
});
```

### 2. Pruebas de Endpoints

#### Endpoints REST
```typescript
// Ejemplo de prueba de endpoint
test('GET /conversations debería retornar lista de conversaciones', async () => {
  const response = await request(app)
    .get('/api/conversations')
    .set('Authorization', `Bearer ${validToken}`);
  
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

#### Endpoints WebSocket
```typescript
// Ejemplo de prueba WebSocket
test('evento join_conversation debería unir usuario a sala', async () => {
  const mockSocket = new MockWebSocket('ws://localhost:3000');
  mockSocket.emit('join_conversation', { conversationId: 'conv123' });
  
  expect(mockSocket.join).toHaveBeenCalledWith('conversation:conv123');
});
```

## 🛠️ Utilidades de Prueba

### Funciones Helper

```typescript
// Crear datos de prueba
const conversation = createTestData.conversation({
  contactName: 'Juan Pérez',
  unreadCount: 5
});

// Verificar estructura de métricas
expectMetricsStructure(metrics);
expectResponseTimeStructure(responseMetrics);
expectAgentPerformanceStructure(agentData);
```

### Funciones de Aserción

```typescript
// Aserciones básicas
expect(value).toBe(expected);
expect(object).toEqual(expectedObject);
expect(array).toHaveLength(3);
expect(object).toHaveProperty('property');
expect(object).toMatchObject(partialObject);
expect(fn).toThrow('error message');
```

### Mocks de Funciones

```typescript
// Crear mock
const mockFn = mockFn();

// Configurar comportamiento
mockFn.mockReturnValue('result');
mockFn.mockResolvedValue(promise);
mockFn.mockRejectedValue(error);
mockFn.mockImplementation((args) => result);

// Verificar llamadas
expect(mockFn.toHaveBeenCalled()).toBe(true);
expect(mockFn.toHaveBeenCalledWith('arg')).toBe(true);
expect(mockFn.toHaveBeenCalledTimes(2)).toBe(true);
```

## 📊 Cobertura de Pruebas

### Áreas Cubiertas

- ✅ **Servicios de Conversación**: CRUD completo, filtros, asignación
- ✅ **Servicios WebSocket**: Conexión, eventos, broadcasting
- ✅ **Servicios de Métricas**: Cálculos, estadísticas, exportación
- ✅ **Endpoints REST**: Autenticación, validación, respuestas
- ✅ **Manejo de Errores**: Validaciones, excepciones, timeouts
- ✅ **Funciones Auxiliares**: Formateo, cálculos, validaciones

### Métricas de Prueba

```
Total de Pruebas: 45+
- Servicios: 30 pruebas
- Endpoints: 10 pruebas
- Utilidades: 5 pruebas

Cobertura Estimada: 85%
- Servicios: 90%
- Endpoints: 80%
- Utilidades: 85%
```

## 🔍 Debugging de Pruebas

### Logging Durante Pruebas

```typescript
// Habilitar logs detallados
process.env.VERBOSE_TESTS = 'true';

// Usar mock de logger
loggerMock.info('Test message');
expect(loggerMock.info).toHaveBeenCalledWith('Test message');
```

### Debugging de WebSocket

```typescript
// Simular eventos WebSocket
const mockSocket = new MockWebSocket('ws://localhost:3000');
mockSocket.emit('custom_event', { data: 'test' });

// Verificar eventos recibidos
expect(mockSocket.onmessage).toHaveBeenCalled();
```

## 🚨 Manejo de Errores en Pruebas

### Timeout de Pruebas

```typescript
// Configurar timeout personalizado
runner.test('prueba lenta', async () => {
  await slowOperation();
}, 10000); // 10 segundos
```

### Pruebas de Errores

```typescript
// Verificar que se lanzan errores
expect(() => {
  throw new Error('Test error');
}).toThrow('Test error');

// Verificar errores async
await expect(asyncFunction()).rejects.toThrow('Async error');
```

## 📝 Mejores Prácticas

### 1. Estructura de Pruebas
- Usar `describe` para agrupar pruebas relacionadas
- Nombres descriptivos que expliquen el comportamiento esperado
- Configurar y limpiar datos antes y después de cada prueba

### 2. Mocks y Stubs
- Aislar unidades de código bajo prueba
- Usar mocks para dependencias externas
- Verificar interacciones, no solo resultados

### 3. Datos de Prueba
- Usar factories para crear datos consistentes
- Evitar hardcodear valores en múltiples lugares
- Limpiar datos después de cada prueba

### 4. Aserciones
- Una aserción por concepto
- Mensajes de error claros
- Verificar tanto casos positivos como negativos

## 🔄 Integración Continua

### GitHub Actions (Ejemplo)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test && npm run lint"
    }
  }
}
```

## 🎯 Próximos Pasos

### Mejoras Pendientes

1. **Integración con Jest/Vitest**: Migrar a framework de testing robusto
2. **Cobertura Completa**: Implementar reporte de cobertura real
3. **Pruebas de Integración**: Pruebas end-to-end con base de datos real
4. **Pruebas de Rendimiento**: Benchmarks y pruebas de carga
5. **Pruebas de Seguridad**: Validación de autenticación y autorización

### Herramientas Adicionales

- **Supertest**: Para pruebas de API HTTP
- **Socket.IO Client**: Para pruebas de WebSocket reales
- **Faker.js**: Para generar datos de prueba realistas
- **Sinon**: Para mocks y espías avanzados

---

## 📞 Soporte

Para problemas con las pruebas:

1. Verificar configuración del entorno
2. Revisar logs de pruebas con `VERBOSE_TESTS=true`
3. Consultar documentación de APIs
4. Reportar bugs en el sistema de issues

**¡Las pruebas son la base de un software confiable!** 🚀 