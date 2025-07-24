// Tipos base para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de usuario
export interface User {
  id: string;
  name: string;
  email: string;
  profile: 'admin' | 'user' | 'manager';
  avatar?: string;
  isActive: boolean;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Tipos de WhatsApp
export interface Whatsapp {
  id: string;
  name: string;
  session: string;
  qrcode?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  retries: number;
  isDefault: boolean;
  isGroup: boolean;
  webhookByEvents: boolean;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappCreateRequest {
  name: string;
  isDefault?: boolean;
  webhookUrl?: string;
}

// Tipos de contactos
export interface Contact {
  id: string;
  name: string;
  number: string;
  email?: string;
  avatar?: string;
  isGroup: boolean;
  isBlocked: boolean;
  companyName?: string;
  position?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface ContactCreateRequest {
  name: string;
  number: string;
  email?: string;
  companyName?: string;
  position?: string;
  address?: string;
  notes?: string;
  tagIds?: string[];
}

// Tipos de tickets
export interface Ticket {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  subject?: string;
  lastMessage?: string;
  unreadMessages: number;
  kanbanColumn?: string;
  kanbanOrder: number;
  contact: Contact;
  whatsapp: Whatsapp;
  user?: User;
  queue?: Queue;
  messages?: Message[];
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = 'open' | 'pending' | 'waiting' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketCreateRequest {
  contactId: string;
  whatsappId: string;
  subject?: string;
  priority?: TicketPriority;
  category?: string;
}

export interface TicketUpdateRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  subject?: string;
  userId?: string;
  queueId?: string;
  kanbanColumn?: string;
  kanbanOrder?: number;
}

// Tipos de mensajes
export interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  read: boolean;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  quotedMsg?: string;
  ticket: Ticket;
  contact: Contact;
  whatsapp: Whatsapp;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface MessageCreateRequest {
  ticketId: string;
  body: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  quotedMsg?: string;
}

// Tipos de colas
export interface Queue {
  id: string;
  name: string;
  color: string;
  greetingMessage?: string;
  outOfHoursMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueCreateRequest {
  name: string;
  color: string;
  greetingMessage?: string;
  outOfHoursMessage?: string;
}

// Tipos de etiquetas
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagCreateRequest {
  name: string;
  color: string;
}

// Tipos de campañas
export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  message: string;
  scheduledAt?: string;
  sentCount: number;
  errorCount: number;
  user: User;
  contacts?: CampaignContact[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCreateRequest {
  name: string;
  message: string;
  scheduledAt?: string;
  contactIds: string[];
}

export interface CampaignContact {
  campaignId: string;
  contactId: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  errorMsg?: string;
  contact: Contact;
}

// Tipos de programaciones
export interface Schedule {
  id: string;
  body: string;
  sendAt: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
  contact: Contact;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleCreateRequest {
  contactId: string;
  body: string;
  sendAt: string;
}

// Tipos de estadísticas
export interface DashboardStats {
  totalMessages: number;
  resolvedTickets: number;
  averageResponseTime: number;
  activeAgents: number;
  platformStats: {
    whatsapp: PlatformStats;
    instagram: PlatformStats;
    facebook: PlatformStats;
  };
}

export interface PlatformStats {
  connected: boolean;
  messagesToday: number;
  responseTime: number;
}

export interface ChartData {
  dailyMessages: Array<{
    day: string;
    WhatsApp: number;
    Instagram: number;
    Facebook: number;
  }>;
  platformDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  responseTimeData: Array<{
    hour: string;
    avgTime: number;
  }>;
  agentPerformance: Array<{
    name: string;
    tickets: number;
    resolved: number;
    satisfaction: number;
  }>;
} 

// Tipos de programaciones automáticas (AutoMessageSchedule)
export interface AutoMessageSchedule {
  id: string;
  connectionId: string;
  message: string;
  timeRanges: Array<{ from: string; to: string }>;
  daysOfWeek: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutoMessageScheduleCreateRequest {
  connectionId: string;
  message: string;
  timeRanges: Array<{ from: string; to: string }>;
  daysOfWeek: number[];
  isActive?: boolean;
} 

// Tipos de Bot Flows
export interface BotFlow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  steps?: BotFlowStep[];
  conditions?: BotFlowCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface BotFlowStep {
  id: string;
  name: string;
  type: 'message' | 'condition' | 'action' | 'delay';
  config: Record<string, any>;
  order: number;
  botFlowId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotFlowCondition {
  id: string;
  name: string;
  description?: string;
  conditionType: 'text_match' | 'keyword' | 'intent' | 'time';
  parameters: Record<string, any>;
  botFlowId: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de conversaciones
export interface Conversation {
  id: string;
  contact: Contact;
  connection: Connection;
  user: User;
  unreadCount: number;
  lastMessage: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Connection {
  id: string;
  name: string;
  type: 'whatsapp_web' | 'whatsapp_business' | 'instagram' | 'facebook';
  status: 'connected' | 'disconnected' | 'connecting';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de notificaciones
export interface Notification {
  id: string;
  type: 'message' | 'ticket' | 'warning' | 'error' | 'success' | 'assignment' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: Date;
  userId: string;
  companyId: string;
} 