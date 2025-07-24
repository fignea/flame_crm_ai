import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import MetricsService from '../../src/services/metricsService';

vi.mock('../../src/prisma/client', () => ({
  prisma: prismaMock
}));

vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('MetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversationMetrics', () => {
    it('debería calcular métricas de conversaciones correctamente', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          createdAt: new Date('2024-01-01'),
          unreadCount: 5,
          user: { id: 'user1', name: 'Juan', agentStatus: 'available' },
          messages: [
            { id: 'msg1', fromMe: true, createdAt: new Date('2024-01-01T10:00:00Z') },
            { id: 'msg2', fromMe: false, createdAt: new Date('2024-01-01T09:00:00Z') }
          ]
        },
        {
          id: 'conv2',
          createdAt: new Date('2024-01-02'),
          unreadCount: 0,
          user: { id: 'user2', name: 'Ana', agentStatus: 'busy' },
          messages: [
            { id: 'msg3', fromMe: true, createdAt: new Date('2024-01-02T11:00:00Z') }
          ]
        }
      ];

      prismaMock.conversation.findMany.mockResolvedValue(mockConversations);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      const result = await MetricsService.getConversationMetrics(filters);

      expect(result).toMatchObject({
        totalConversations: 2,
        activeConversations: 1,
        conversationsByStatus: {
          active: 1,
          inactive: 1
        }
      });

      expect(result.conversationsByAgent).toHaveLength(2);
      expect(result.conversationsByHour).toHaveLength(24);
    });

    it('debería manejar conversaciones vacías', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([]);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      const result = await MetricsService.getConversationMetrics(filters);

      expect(result).toMatchObject({
        totalConversations: 0,
        activeConversations: 0,
        newConversations: 0,
        closedConversations: 0,
        avgConversationDuration: 0
      });
    });
  });

  describe('getResponseTimeMetrics', () => {
    it('debería calcular tiempos de respuesta correctamente', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          conversationId: 'conv1',
          fromMe: false,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          user: { id: 'user1', name: 'Juan' },
          conversation: { id: 'conv1', createdAt: new Date('2024-01-01T09:00:00Z') }
        },
        {
          id: 'msg2',
          conversationId: 'conv1',
          fromMe: true,
          createdAt: new Date('2024-01-01T10:05:00Z'),
          user: { id: 'user1', name: 'Juan' },
          conversation: { id: 'conv1', createdAt: new Date('2024-01-01T09:00:00Z') }
        }
      ];

      prismaMock.message.findMany.mockResolvedValue(mockMessages);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      const result = await MetricsService.getResponseTimeMetrics(filters);

      expect(result).toHaveProperty('avgResponseTime');
      expect(result).toHaveProperty('medianResponseTime');
      expect(result).toHaveProperty('slaCompliance');
      expect(result.slaCompliance).toHaveProperty('target', 5);
      expect(result.responseTimeByAgent).toBeInstanceOf(Array);
    });
  });

  describe('getMessageMetrics', () => {
    it('debería calcular métricas de mensajes correctamente', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          conversationId: 'conv1',
          fromMe: false,
          content: 'Hola mundo',
          mediaType: 'text',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          conversation: { id: 'conv1' }
        },
        {
          id: 'msg2',
          conversationId: 'conv1',
          fromMe: true,
          content: 'Hola, ¿cómo estás?',
          mediaType: 'text',
          createdAt: new Date('2024-01-01T10:05:00Z'),
          conversation: { id: 'conv1' }
        },
        {
          id: 'msg3',
          conversationId: 'conv2',
          fromMe: false,
          content: null,
          mediaType: 'image',
          createdAt: new Date('2024-01-01T11:00:00Z'),
          conversation: { id: 'conv2' }
        }
      ];

      prismaMock.message.findMany.mockResolvedValue(mockMessages);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      const result = await MetricsService.getMessageMetrics(filters);

      expect(result).toMatchObject({
        totalMessages: 3,
        incomingMessages: 2,
        outgoingMessages: 1,
        avgMessagesPerConversation: 1.5
      });

      expect(result.messagesByType).toHaveProperty('text', 2);
      expect(result.messagesByType).toHaveProperty('image', 1);
      expect(result.messagesByHour).toHaveLength(24);
      expect(result.topKeywords).toBeInstanceOf(Array);
    });
  });

  describe('getAgentPerformance', () => {
    it('debería calcular rendimiento de agentes correctamente', async () => {
      const mockAgents = [
        {
          id: 'user1',
          name: 'Juan Pérez',
          companyId: 'company1',
          agentStatus: 'available',
          isActive: true,
          role: { name: 'agent' },
          conversations: [
            {
              id: 'conv1',
              createdAt: new Date('2024-01-01'),
              unreadCount: 3,
              messages: [
                { id: 'msg1', fromMe: true, createdAt: new Date('2024-01-01T10:00:00Z') },
                { id: 'msg2', fromMe: true, createdAt: new Date('2024-01-01T10:05:00Z') }
              ]
            }
          ]
        },
        {
          id: 'user2',
          name: 'Ana García',
          companyId: 'company1',
          agentStatus: 'busy',
          isActive: true,
          role: { name: 'agent' },
          conversations: [
            {
              id: 'conv2',
              createdAt: new Date('2024-01-01'),
              unreadCount: 0,
              messages: [
                { id: 'msg3', fromMe: true, createdAt: new Date('2024-01-01T11:00:00Z') }
              ]
            }
          ]
        }
      ];

      prismaMock.user.findMany.mockResolvedValue(mockAgents);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      const result = await MetricsService.getAgentPerformance(filters);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        agentId: 'user1',
        agentName: 'Juan Pérez',
        totalConversations: 1,
        activeConversations: 1,
        totalMessages: 2,
        status: 'available'
      });

      expect(result[0]).toHaveProperty('avgResponseTime');
      expect(result[0]).toHaveProperty('workingHours');
      expect(result[0]).toHaveProperty('productivityScore');
    });
  });

  describe('getSystemHealthMetrics', () => {
    it('debería obtener métricas de salud del sistema', async () => {
      prismaMock.connection.count.mockResolvedValue(5);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      const result = await MetricsService.getSystemHealthMetrics(filters);

      expect(result).toMatchObject({
        avgServerResponseTime: 150,
        errorRate: 0.5,
        uptime: 99.9,
        memoryUsage: 65,
        activeConnections: 5
      });
    });
  });

  describe('getPerformanceMetrics', () => {
    it('debería obtener métricas completas de rendimiento', async () => {
      // Mock para todas las métricas
      prismaMock.conversation.findMany.mockResolvedValue([]);
      prismaMock.message.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.connection.count.mockResolvedValue(5);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      const result = await MetricsService.getPerformanceMetrics(filters);

      expect(result).toHaveProperty('conversationMetrics');
      expect(result).toHaveProperty('responseTimeMetrics');
      expect(result).toHaveProperty('messageMetrics');
      expect(result).toHaveProperty('agentPerformance');
      expect(result).toHaveProperty('systemHealth');
    });

    it('debería manejar errores en el cálculo de métricas', async () => {
      prismaMock.conversation.findMany.mockRejectedValue(new Error('Database error'));

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      await expect(MetricsService.getPerformanceMetrics(filters))
        .rejects.toThrow('Database error');
    });
  });

  describe('métodos auxiliares', () => {
    describe('calculateAvgConversationDuration', () => {
      it('debería calcular duración promedio correctamente', () => {
        const conversations = [
          {
            messages: [
              { createdAt: new Date('2024-01-01T10:00:00Z') },
              { createdAt: new Date('2024-01-01T10:30:00Z') }
            ]
          },
          {
            messages: [
              { createdAt: new Date('2024-01-01T11:00:00Z') },
              { createdAt: new Date('2024-01-01T11:15:00Z') }
            ]
          }
        ];

        const result = (MetricsService as any).calculateAvgConversationDuration(conversations);
        expect(result).toBe(22.5); // Promedio de 30 y 15 minutos
      });
    });

    describe('calculateResponseTimes', () => {
      it('debería calcular tiempos de respuesta correctamente', () => {
        const messages = [
          {
            conversationId: 'conv1',
            fromMe: false,
            createdAt: new Date('2024-01-01T10:00:00Z')
          },
          {
            conversationId: 'conv1',
            fromMe: true,
            createdAt: new Date('2024-01-01T10:05:00Z')
          }
        ];

        const result = (MetricsService as any).calculateResponseTimes(messages);
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(5); // 5 minutos de diferencia
      });
    });

    describe('calculateSLACompliance', () => {
      it('debería calcular cumplimiento de SLA correctamente', () => {
        const responseTimes = [2, 3, 6, 8, 1]; // Target: 5 minutos
        const target = 5;

        const result = (MetricsService as any).calculateSLACompliance(responseTimes, target);

        expect(result).toMatchObject({
          target: 5,
          compliance: 60, // 3 de 5 están dentro del SLA
          breaches: 2
        });
      });
    });

    describe('calculateMedian', () => {
      it('debería calcular mediana correctamente', () => {
        const numbers = [1, 3, 5, 7, 9];
        const result = (MetricsService as any).calculateMedian(numbers);
        expect(result).toBe(5);
      });

      it('debería manejar arrays pares', () => {
        const numbers = [2, 4, 6, 8];
        const result = (MetricsService as any).calculateMedian(numbers);
        expect(result).toBe(5); // (4 + 6) / 2
      });

      it('debería manejar arrays vacíos', () => {
        const numbers: number[] = [];
        const result = (MetricsService as any).calculateMedian(numbers);
        expect(result).toBe(0);
      });
    });

    describe('getTopKeywords', () => {
      it('debería extraer keywords principales correctamente', () => {
        const messages = [
          { fromMe: false, content: 'Hola mundo, necesito ayuda con mi producto' },
          { fromMe: false, content: 'Mi producto no funciona correctamente' },
          { fromMe: true, content: 'Te ayudo con tu problema' }
        ];

        const result = (MetricsService as any).getTopKeywords(messages);

        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeLessThanOrEqual(10);
        
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('keyword');
          expect(result[0]).toHaveProperty('count');
          expect(result[0]).toHaveProperty('percentage');
        }
      });
    });

    describe('calculateProductivityScore', () => {
      it('debería calcular puntuación de productividad correctamente', () => {
        const conversations = 10;
        const avgResponseTime = 3;
        const messages = 50;
        const workingHours = 8;

        const result = (MetricsService as any).calculateProductivityScore(
          conversations,
          avgResponseTime,
          messages,
          workingHours
        );

        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('filtros y validaciones', () => {
    it('debería aplicar filtros por agente correctamente', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          userId: 'user1',
          createdAt: new Date('2024-01-01'),
          unreadCount: 0,
          user: { id: 'user1', name: 'Juan', agentStatus: 'available' },
          messages: []
        }
      ];

      prismaMock.conversation.findMany.mockResolvedValue(mockConversations);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1',
        agentId: 'user1'
      };

      await MetricsService.getConversationMetrics(filters);

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user1'
        }),
        include: expect.any(Object)
      });
    });

    it('debería aplicar filtros por conexión correctamente', async () => {
      const mockMessages = [];
      prismaMock.message.findMany.mockResolvedValue(mockMessages);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1',
        connectionId: 'conn1'
      };

      await MetricsService.getMessageMetrics(filters);

      expect(prismaMock.message.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          connectionId: 'conn1'
        }),
        include: expect.any(Object)
      });
    });

    it('debería validar fechas correctamente', async () => {
      const invalidFilters = {
        startDate: new Date('invalid'),
        endDate: new Date('2024-01-31'),
        companyId: 'company1'
      };

      // Esto debería manejar fechas inválidas graciosamente
      await expect(MetricsService.getConversationMetrics(invalidFilters))
        .rejects.toThrow();
    });
  });
});

export default {}; 