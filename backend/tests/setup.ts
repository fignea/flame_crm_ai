// Mock de Prisma para pruebas
export const prismaMock = {
  conversation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  connection: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  company: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  contact: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  mediaFile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  messageTemplate: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  reaction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
};

// Variables de entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.PORT = '3001';

// Mock de logger
export const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock de Socket.IO
export const socketMock = {
  id: 'test-socket-id',
  userId: 'test-user-id',
  companyId: 'test-company-id',
  join: jest.fn(),
  leave: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
  handshake: {
    auth: {
      token: 'test-token'
    }
  }
};

export const ioMock = {
  to: jest.fn(() => ({
    emit: jest.fn()
  })),
  in: jest.fn(() => ({
    emit: jest.fn()
  })),
  emit: jest.fn(),
  on: jest.fn(),
  use: jest.fn(),
  sockets: {
    in: jest.fn(() => ({
      emit: jest.fn()
    }))
  }
};

// Configuración global de Jest
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Timeout global para pruebas
jest.setTimeout(10000);

// Mock de funciones de fecha para pruebas deterministas
const mockDate = new Date('2024-01-15T10:00:00Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
Date.now = jest.fn(() => mockDate.getTime());

// Función helper para crear datos de prueba
export const createTestData = {
  conversation: (overrides = {}) => ({
    id: 'test-conversation-id',
    connectionId: 'test-connection-id',
    contactPhone: '+1234567890',
    contactName: 'Test User',
    lastMessage: 'Test message',
    lastMessageAt: new Date(),
    unreadCount: 0,
    isActive: true,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  message: (overrides = {}) => ({
    id: 'test-message-id',
    conversationId: 'test-conversation-id',
    connectionId: 'test-connection-id',
    content: 'Test message content',
    fromMe: false,
    mediaType: 'text',
    mediaUrl: null,
    isRead: false,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    companyId: 'test-company-id',
    roleId: 'test-role-id',
    agentStatus: 'available',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  connection: (overrides = {}) => ({
    id: 'test-connection-id',
    name: 'Test Connection',
    phoneNumber: '+1234567890',
    status: 'CONNECTED',
    companyId: 'test-company-id',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  company: (overrides = {}) => ({
    id: 'test-company-id',
    name: 'Test Company',
    email: 'test@company.com',
    phone: '+1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  mediaFile: (overrides = {}) => ({
    id: 'test-media-file-id',
    messageId: 'test-message-id',
    fileName: 'test-file.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024,
    fileUrl: 'http://example.com/file.jpg',
    thumbnailUrl: 'http://example.com/thumb.jpg',
    createdAt: new Date(),
    ...overrides
  }),

  messageTemplate: (overrides = {}) => ({
    id: 'test-template-id',
    name: 'Test Template',
    content: 'Test template content',
    category: 'general',
    shortcut: 'test',
    companyId: 'test-company-id',
    isActive: true,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  metrics: (overrides = {}) => ({
    totalConversations: 10,
    activeConversations: 5,
    newConversations: 3,
    closedConversations: 2,
    avgConversationDuration: 30,
    avgResponseTime: 5,
    totalMessages: 50,
    incomingMessages: 30,
    outgoingMessages: 20,
    ...overrides
  })
};

// Funciones helper para aserciones
export const expectMetricsStructure = (metrics: any) => {
  expect(metrics).toHaveProperty('totalConversations');
  expect(metrics).toHaveProperty('activeConversations');
  expect(metrics).toHaveProperty('conversationsByAgent');
  expect(metrics).toHaveProperty('conversationsByHour');
  expect(metrics.conversationsByHour).toHaveLength(24);
};

export const expectResponseTimeStructure = (metrics: any) => {
  expect(metrics).toHaveProperty('avgResponseTime');
  expect(metrics).toHaveProperty('medianResponseTime');
  expect(metrics).toHaveProperty('slaCompliance');
  expect(metrics.slaCompliance).toHaveProperty('target');
  expect(metrics.slaCompliance).toHaveProperty('compliance');
  expect(metrics.slaCompliance).toHaveProperty('breaches');
};

export const expectAgentPerformanceStructure = (agent: any) => {
  expect(agent).toHaveProperty('agentId');
  expect(agent).toHaveProperty('agentName');
  expect(agent).toHaveProperty('totalConversations');
  expect(agent).toHaveProperty('avgResponseTime');
  expect(agent).toHaveProperty('productivityScore');
};

// Mock de WebSocket para pruebas
export class MockWebSocket {
  public readyState = 1; // OPEN
  public url = 'ws://localhost:3000';
  public onopen = jest.fn();
  public onclose = jest.fn();
  public onmessage = jest.fn();
  public onerror = jest.fn();
  public send = jest.fn();
  public close = jest.fn();

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      if (this.onopen) this.onopen({} as Event);
    }, 0);
  }

  emit(event: string, data?: any) {
    if (this.onmessage) {
      this.onmessage({
        data: JSON.stringify({ event, data })
      } as MessageEvent);
    }
  }
}

// Mock global de WebSocket
(global as any).WebSocket = MockWebSocket;

export default {
  prismaMock,
  loggerMock,
  socketMock,
  ioMock,
  createTestData,
  expectMetricsStructure,
  expectResponseTimeStructure,
  expectAgentPerformanceStructure,
  MockWebSocket
}; 