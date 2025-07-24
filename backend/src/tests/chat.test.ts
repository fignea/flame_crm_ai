import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../prisma/client';
import { authService } from '../services/authService';
import ConversationAssignmentService from '../services/conversationAssignmentService';
import { NotificationService } from '../services/notificationService';
import { ConversationHistoryService } from '../services/conversationHistoryService';
import { WhatsAppConfigService } from '../services/whatsappConfigService';

// Mock de socket service
jest.mock('../services/socketService', () => ({
  getIO: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  }))
}));

// Mock de WhatsApp service
jest.mock('../services/whatsappService', () => ({
  sendMessage: jest.fn(),
  sendWhatsAppLocation: jest.fn(),
  getSession: jest.fn(),
  startWhatsAppSession: jest.fn()
}));

describe('Chat Functionality Tests', () => {
  let authToken: string;
  let userId: string;
  let companyId: string;
  let contactId: string;
  let connectionId: string;
  let conversationId: string;

  beforeAll(async () => {
    // Configurar datos de prueba
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '123456789'
      }
    });
    companyId = company.id;

    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@user.com',
        password: await authService.hashPassword('password123'),
        profile: 'user',
        companyId
      }
    });
    userId = user.id;

    const contact = await prisma.contact.create({
      data: {
        name: 'Test Contact',
        number: '1234567890',
        companyId
      }
    });
    contactId = contact.id;

    const connection = await prisma.connection.create({
      data: {
        name: 'Test Connection',
        type: 'whatsapp_web',
        companyId
      }
    });
    connectionId = connection.id;

    const conversation = await prisma.conversation.create({
      data: {
        contactId,
        connectionId,
        userId
      }
    });
    conversationId = conversation.id;

    // Obtener token de autenticación
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@user.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.connection.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Conversation Management', () => {
    it('should get conversations with pagination', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.conversations).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter conversations by connection', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ connectionId });

      expect(response.status).toBe(200);
      expect(response.body.conversations).toBeDefined();
      expect(response.body.conversations.length).toBeGreaterThan(0);
    });

    it('should search conversations by contact name', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test Contact' });

      expect(response.status).toBe(200);
      expect(response.body.conversations).toBeDefined();
      expect(response.body.conversations.length).toBeGreaterThan(0);
    });

    it('should get conversation statistics', async () => {
      const response = await request(app)
        .get('/api/conversations/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalConversations).toBeDefined();
      expect(response.body.stats.unreadCount).toBeDefined();
    });
  });

  describe('Message Management', () => {
    let messageId: string;

    it('should send a text message', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test message',
          mediaType: 'text'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBe('Test message');
      expect(response.body.message.fromMe).toBe(true);
      messageId = response.body.message.id;
    });

    it('should get messages for a conversation', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toBeDefined();
      expect(response.body.messages.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should send a location message', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Location message',
          mediaType: 'location',
          locationLatitude: -34.6037,
          locationLongitude: -58.3816,
          locationAddress: 'Buenos Aires, Argentina'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.mediaType).toBe('location');
      expect(response.body.message.locationLatitude).toBe(-34.6037);
      expect(response.body.message.locationLongitude).toBe(-58.3816);
    });

    it('should mark conversation as read', async () => {
      const response = await request(app)
        .patch(`/api/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should add reaction to message', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages/${messageId}/reaction`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reaction: '👍'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.reaction).toBe('👍');
    });
  });

  describe('Conversation Assignment', () => {
    let assignmentService: ConversationAssignmentService;

    beforeEach(() => {
      assignmentService = new ConversationAssignmentService();
    });

    it('should assign conversation to available agent', async () => {
      const assignment = await assignmentService.assignConversation(
        conversationId,
        companyId,
        'automatic'
      );

      expect(assignment).toBeDefined();
      expect(assignment.conversationId).toBe(conversationId);
      expect(assignment.assignedUserId).toBeDefined();
      expect(assignment.assignmentMethod).toBe('automatic');
    });

    it('should transfer conversation to another agent', async () => {
      const response = await request(app)
        .post(`/api/conversation-assignment/${conversationId}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetUserId: userId,
          reason: 'Test transfer'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get assignment metrics', async () => {
      const response = await request(app)
        .get('/api/assignment-metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.totalAssignments).toBeDefined();
      expect(response.body.metrics.averageResponseTime).toBeDefined();
    });
  });

  describe('Advanced Search', () => {
    it('should search conversations by content', async () => {
      const response = await request(app)
        .post('/api/advanced-search/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Test message',
          filters: {
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should search messages with advanced filters', async () => {
      const response = await request(app)
        .post('/api/advanced-search/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Test',
          filters: {
            messageType: 'text',
            fromMe: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBeGreaterThan(0);
    });

    it('should export search results', async () => {
      const response = await request(app)
        .post('/api/advanced-search/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Test message',
          format: 'csv',
          filters: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.exportId).toBeDefined();
      expect(response.body.downloadUrl).toBeDefined();
    });
  });

  describe('Conversation History', () => {
    it('should get conversation history with filters', async () => {
      const response = await request(app)
        .get('/api/conversation-history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
          page: 1,
          limit: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.data.conversations).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should get history statistics', async () => {
      const response = await request(app)
        .get('/api/conversation-history/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalConversations).toBeDefined();
      expect(response.body.data.totalMessages).toBeDefined();
    });

    it('should export conversation history', async () => {
      const response = await request(app)
        .post('/api/conversation-history/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filters: {},
          options: {
            format: 'json',
            includeMedia: false,
            maxRecords: 100
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.exportId).toBeDefined();
    });

    it('should archive conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation-history/${conversationId}/archive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Notifications', () => {
    let notificationService: NotificationService;

    beforeEach(() => {
      notificationService = NotificationService.getInstance();
    });

    it('should send notification', async () => {
      await notificationService.sendNotification({
        type: 'message',
        title: 'Test Notification',
        message: 'This is a test notification',
        userId,
        companyId,
        priority: 'medium',
        channels: ['websocket']
      });

      const notifications = await notificationService.getUserNotifications(userId);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].title).toBe('Test Notification');
    });

    it('should get notification preferences', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.channels).toBeDefined();
      expect(response.body.data.types).toBeDefined();
    });

    it('should update notification preferences', async () => {
      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          channels: {
            websocket: true,
            push: false,
            email: false
          },
          soundEnabled: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should mark notification as read', async () => {
      const notifications = await notificationService.getUserNotifications(userId);
      const notificationId = notifications[0].id;

      const response = await request(app)
        .post(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('WhatsApp Configuration', () => {
    it('should get WhatsApp configuration', async () => {
      const response = await request(app)
        .get(`/api/whatsapp-config/${connectionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.config).toBeDefined();
      expect(response.body.config.enableWelcomeMessage).toBeDefined();
    });

    it('should update WhatsApp configuration', async () => {
      const response = await request(app)
        .put(`/api/whatsapp-config/${connectionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          enableWelcomeMessage: true,
          welcomeMessage: 'Welcome to our service!',
          enableBusinessHours: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate WhatsApp configuration', async () => {
      const response = await request(app)
        .post(`/api/whatsapp-config/${connectionId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          enableWelcomeMessage: true,
          welcomeMessage: 'Test message',
          businessHours: {
            monday: { enabled: true, start: '09:00', end: '18:00' }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });
  });

  describe('Real-time Features', () => {
    it('should handle typing events', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/typing`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isTyping: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle presence updates', async () => {
      const response = await request(app)
        .post('/api/users/presence')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'online',
          lastSeen: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent message sends', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post(`/api/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              content: `Performance test message ${i}`,
              mediaType: 'text'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.message).toBeDefined();
      });
    });

    it('should handle large conversation list efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 100 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle conversation search efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/advanced-search/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Test',
          filters: {}
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid conversation ID', async () => {
      const response = await request(app)
        .get('/api/conversations/invalid-id/messages')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/conversations');

      expect(response.status).toBe(401);
    });

    it('should handle invalid message data', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '', // Empty content
          mediaType: 'text'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle database connection issues', async () => {
      // Mock database error
      const originalFind = prisma.conversation.findMany;
      prisma.conversation.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();

      // Restore original method
      prisma.conversation.findMany = originalFind;
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in search', async () => {
      const response = await request(app)
        .post('/api/advanced-search/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: "'; DROP TABLE messages; --",
          filters: {}
        });

      expect(response.status).toBe(200);
      // Should not crash and should return empty results
    });

    it('should prevent XSS in message content', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '<script>alert("XSS")</script>',
          mediaType: 'text'
        });

      expect(response.status).toBe(201);
      expect(response.body.message.content).not.toContain('<script>');
    });

    it('should validate file upload security', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'test.exe')
        .field('content', 'File message')
        .field('mediaType', 'document');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('file type');
    });
  });
}); 