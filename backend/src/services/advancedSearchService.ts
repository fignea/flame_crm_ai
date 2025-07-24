import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

export interface AdvancedSearchFilters {
  // Filtros básicos
  search?: string;
  companyId: string;
  
  // Filtros de contenido
  contentType?: 'all' | 'text' | 'media' | 'documents' | 'location';
  searchInContent?: boolean;
  searchInContactInfo?: boolean;
  searchInMetadata?: boolean;
  
  // Filtros temporales
  dateFrom?: Date;
  dateTo?: Date;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek?: number[]; // 0-6, donde 0 es domingo
  
  // Filtros por ubicación
  hasLocation?: boolean;
  nearLatitude?: number;
  nearLongitude?: number;
  radiusKm?: number;
  
  // Filtros por agente
  agentId?: string;
  responseTimeMin?: number; // en minutos
  responseTimeMax?: number;
  
  // Filtros por reacciones
  hasReactions?: boolean;
  reactionType?: string;
  
  // Filtros por archivos
  fileType?: 'images' | 'videos' | 'audio' | 'documents';
  fileSizeMin?: number; // en bytes
  fileSizeMax?: number;
  
  // Filtros por contacto
  contactAttributes?: { [key: string]: string };
  contactTags?: string[];
  
  // Filtros por conversación
  messageCountMin?: number;
  messageCountMax?: number;
  conversationDurationMin?: number; // en horas
  conversationDurationMax?: number;
  
  // Configuración de búsqueda
  fuzzySearch?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  includeDeleted?: boolean;
  
  // Paginación y ordenamiento
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'responseTime' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  conversations: ConversationSearchResult[];
  messages: MessageSearchResult[];
  contacts: ContactSearchResult[];
  totalResults: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchStats: {
    searchTime: number;
    indexesUsed: string[];
    suggestedQueries: string[];
  };
}

export interface ConversationSearchResult {
  id: string;
  contact: {
    id: string;
    name: string;
    number: string;
    avatar?: string;
  };
  connection: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    timestamp: Date;
    fromMe: boolean;
  };
  matchedMessages: MessageSearchResult[];
  messageCount: number;
  unreadCount: number;
  averageResponseTime: number;
  relevanceScore: number;
  highlights: string[];
}

export interface MessageSearchResult {
  id: string;
  content: string;
  fromMe: boolean;
  timestamp: Date;
  mediaType?: string;
  mediaUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  fileName?: string;
  fileSize?: number;
  reaction?: string;
  conversationId: string;
  contactId: string;
  relevanceScore: number;
  highlights: string[];
}

export interface ContactSearchResult {
  id: string;
  name: string;
  number: string;
  email?: string;
  avatar?: string;
  tags: any[];
  conversationCount: number;
  lastContactDate: Date;
  relevanceScore: number;
  highlights: string[];
}

export class AdvancedSearchService {
  // Búsqueda principal
  static async search(filters: AdvancedSearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      const results = await Promise.all([
        this.searchConversations(filters),
        this.searchMessages(filters),
        this.searchContacts(filters)
      ]);
      
      const [conversations, messages, contacts] = results;
      const totalResults = conversations.length + messages.length + contacts.length;
      
      // Calcular estadísticas de búsqueda
      const searchTime = Date.now() - startTime;
      const searchStats = {
        searchTime,
        indexesUsed: this.getIndexesUsed(filters),
        suggestedQueries: this.generateSuggestedQueries(filters)
      };
      
      return {
        conversations: conversations.slice(0, filters.limit || 50),
        messages: messages.slice(0, filters.limit || 50),
        contacts: contacts.slice(0, filters.limit || 50),
        totalResults,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total: totalResults,
          totalPages: Math.ceil(totalResults / (filters.limit || 50))
        },
        searchStats
      };
    } catch (error) {
      logger.error('Error in advanced search:', error);
      throw error;
    }
  }

  // Búsqueda de conversaciones
  static async searchConversations(filters: AdvancedSearchFilters): Promise<ConversationSearchResult[]> {
    try {
      const where: any = {
        connection: { companyId: filters.companyId }
      };

      // Construir filtros de búsqueda
      this.buildSearchFilters(where, filters);
      this.buildTemporalFilters(where, filters);
      this.buildAgentFilters(where, filters);
      this.buildContentFilters(where, filters);

      const conversations = await prisma.conversation.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              number: true,
              avatar: true,
              tags: true
            }
          },
          connection: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 5,
            include: {
              contact: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: this.buildOrderBy(filters),
        take: filters.limit || 50
      });

      return conversations.map(conv => this.transformConversationResult(conv, filters));
    } catch (error) {
      logger.error('Error searching conversations:', error);
      return [];
    }
  }

  // Búsqueda de mensajes
  static async searchMessages(filters: AdvancedSearchFilters): Promise<MessageSearchResult[]> {
    try {
      const where: any = {
        conversation: {
          connection: { companyId: filters.companyId }
        }
      };

      // Filtros específicos para mensajes
      this.buildMessageFilters(where, filters);
      this.buildLocationFilters(where, filters);
      this.buildFileFilters(where, filters);
      this.buildReactionFilters(where, filters);

      const messages = await prisma.message.findMany({
        where,
        include: {
          conversation: {
            include: {
              contact: {
                select: {
                  id: true,
                  name: true,
                  number: true
                }
              }
            }
          }
        },
        orderBy: this.buildOrderBy(filters),
        take: filters.limit || 50
      });

      return messages.map(msg => this.transformMessageResult(msg, filters));
    } catch (error) {
      logger.error('Error searching messages:', error);
      return [];
    }
  }

  // Búsqueda de contactos
  static async searchContacts(filters: AdvancedSearchFilters): Promise<ContactSearchResult[]> {
    try {
      const where: any = {
        companyId: filters.companyId
      };

      // Filtros específicos para contactos
      this.buildContactFilters(where, filters);

      const contacts = await prisma.contact.findMany({
        where,
        include: {
          tags: true,
          conversations: {
            select: {
              id: true,
              updatedAt: true
            }
          },
          messages: {
            select: {
              id: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: this.buildOrderBy(filters),
        take: filters.limit || 50
      });

      return contacts.map(contact => this.transformContactResult(contact, filters));
    } catch (error) {
      logger.error('Error searching contacts:', error);
      return [];
    }
  }

  // Construir filtros de búsqueda general
  private static buildSearchFilters(where: any, filters: AdvancedSearchFilters) {
    if (!filters.search) return;

    const searchTerms = filters.search.split(' ').filter(term => term.length > 0);
    
    if (filters.exactMatch) {
      where.OR = [
        { contact: { name: { equals: filters.search, mode: filters.caseSensitive ? 'default' : 'insensitive' } } },
        { contact: { number: { equals: filters.search } } },
        { messages: { some: { content: { equals: filters.search, mode: filters.caseSensitive ? 'default' : 'insensitive' } } } }
      ];
    } else {
      where.OR = [];
      
      searchTerms.forEach(term => {
        if (filters.searchInContactInfo !== false) {
          where.OR.push(
            { contact: { name: { contains: term, mode: filters.caseSensitive ? 'default' : 'insensitive' } } },
            { contact: { number: { contains: term } } },
            { contact: { email: { contains: term, mode: filters.caseSensitive ? 'default' : 'insensitive' } } }
          );
        }
        
        if (filters.searchInContent !== false) {
          where.OR.push(
            { messages: { some: { content: { contains: term, mode: filters.caseSensitive ? 'default' : 'insensitive' } } } }
          );
        }
        
        if (filters.searchInMetadata) {
          where.OR.push(
            { messages: { some: { locationAddress: { contains: term, mode: filters.caseSensitive ? 'default' : 'insensitive' } } } },
            { messages: { some: { fileName: { contains: term, mode: filters.caseSensitive ? 'default' : 'insensitive' } } } }
          );
        }
      });
    }
  }

  // Construir filtros temporales
  private static buildTemporalFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.timeOfDay) {
      const timeRanges = {
        morning: { start: 6, end: 12 },
        afternoon: { start: 12, end: 18 },
        evening: { start: 18, end: 22 },
        night: { start: 22, end: 6 }
      };
      
      const range = timeRanges[filters.timeOfDay];
      if (range) {
        where.messages = {
          some: {
            timestamp: {
              gte: new Date().setHours(range.start, 0, 0, 0),
              lte: new Date().setHours(range.end, 0, 0, 0)
            }
          }
        };
      }
    }

    if (filters.dayOfWeek && filters.dayOfWeek.length > 0) {
      // Implementar filtro por día de la semana usando SQL raw o función personalizada
      // Esta es una implementación simplificada
      where.messages = {
        some: {
          // Esto requeriría una función SQL personalizada para extraer el día de la semana
        }
      };
    }
  }

  // Construir filtros por agente
  private static buildAgentFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.agentId) {
      where.userId = filters.agentId;
    }

    if (filters.responseTimeMin || filters.responseTimeMax) {
      // Implementar filtro por tiempo de respuesta
      // Esto requiere cálculos complejos entre mensajes
    }
  }

  // Construir filtros de contenido
  private static buildContentFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.contentType && filters.contentType !== 'all') {
      switch (filters.contentType) {
        case 'text':
          where.messages = {
            some: {
              OR: [
                { mediaType: null },
                { mediaType: 'text' }
              ]
            }
          };
          break;
        case 'media':
          where.messages = {
            some: {
              mediaType: { in: ['image', 'video', 'audio'] }
            }
          };
          break;
        case 'documents':
          where.messages = {
            some: {
              mediaType: 'document'
            }
          };
          break;
        case 'location':
          where.messages = {
            some: {
              mediaType: 'location'
            }
          };
          break;
      }
    }
  }

  // Construir filtros específicos para mensajes
  private static buildMessageFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.search) {
      where.content = {
        contains: filters.search,
        mode: filters.caseSensitive ? 'default' : 'insensitive'
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {};
      if (filters.dateFrom) where.timestamp.gte = filters.dateFrom;
      if (filters.dateTo) where.timestamp.lte = filters.dateTo;
    }
  }

  // Construir filtros de ubicación
  private static buildLocationFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.hasLocation) {
      where.locationLatitude = { not: null };
      where.locationLongitude = { not: null };
    }

    if (filters.nearLatitude && filters.nearLongitude && filters.radiusKm) {
      // Implementar búsqueda por proximidad geográfica
      // Esto requiere cálculos de distancia usando fórmulas geoespaciales
      const radiusInDegrees = filters.radiusKm / 111; // Aproximación simple
      
      where.locationLatitude = {
        gte: filters.nearLatitude - radiusInDegrees,
        lte: filters.nearLatitude + radiusInDegrees
      };
      where.locationLongitude = {
        gte: filters.nearLongitude - radiusInDegrees,
        lte: filters.nearLongitude + radiusInDegrees
      };
    }
  }

  // Construir filtros de archivos
  private static buildFileFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.fileType) {
      switch (filters.fileType) {
        case 'images':
          where.mediaType = 'image';
          break;
        case 'videos':
          where.mediaType = 'video';
          break;
        case 'audio':
          where.mediaType = 'audio';
          break;
        case 'documents':
          where.mediaType = 'document';
          break;
      }
    }

    if (filters.fileSizeMin || filters.fileSizeMax) {
      where.fileSize = {};
      if (filters.fileSizeMin) where.fileSize.gte = filters.fileSizeMin;
      if (filters.fileSizeMax) where.fileSize.lte = filters.fileSizeMax;
    }
  }

  // Construir filtros de reacciones
  private static buildReactionFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.hasReactions) {
      where.reaction = { not: null };
    }

    if (filters.reactionType) {
      where.reaction = filters.reactionType;
    }
  }

  // Construir filtros de contactos
  private static buildContactFilters(where: any, filters: AdvancedSearchFilters) {
    if (filters.contactTags && filters.contactTags.length > 0) {
      where.tags = {
        some: {
          OR: filters.contactTags.map(tag => ({
            OR: [
              { attribute: { contains: tag, mode: 'insensitive' } },
              { value: { contains: tag, mode: 'insensitive' } }
            ]
          }))
        }
      };
    }

    if (filters.contactAttributes) {
      Object.entries(filters.contactAttributes).forEach(([key, value]) => {
        where.tags = {
          some: {
            attribute: { contains: key, mode: 'insensitive' },
            value: { contains: value, mode: 'insensitive' }
          }
        };
      });
    }
  }

  // Construir ordenamiento
  private static buildOrderBy(filters: AdvancedSearchFilters): any {
    const order = filters.sortOrder || 'desc';
    
    switch (filters.sortBy) {
      case 'date':
        return { createdAt: order };
      case 'responseTime':
        return { updatedAt: order };
      case 'messageCount':
        return { messages: { _count: order } };
      case 'relevance':
      default:
        return { updatedAt: order };
    }
  }

  // Transformar resultado de conversación
  private static transformConversationResult(conv: any, filters: AdvancedSearchFilters): ConversationSearchResult {
    const highlights = this.generateHighlights(conv, filters);
    
    return {
      id: conv.id,
      contact: conv.contact,
      connection: conv.connection,
      user: conv.user,
      lastMessage: conv.messages[0] ? {
        id: conv.messages[0].id,
        content: conv.messages[0].content,
        timestamp: conv.messages[0].timestamp,
        fromMe: conv.messages[0].fromMe
      } : undefined,
      matchedMessages: conv.messages.map((msg: any) => this.transformMessageResult(msg, filters)),
      messageCount: conv.messages.length,
      unreadCount: conv.unreadCount,
      averageResponseTime: 0, // Calcular en implementación real
      relevanceScore: this.calculateRelevanceScore(conv, filters),
      highlights
    };
  }

  // Transformar resultado de mensaje
  private static transformMessageResult(msg: any, filters: AdvancedSearchFilters): MessageSearchResult {
    const highlights = this.generateHighlights(msg, filters);
    
    return {
      id: msg.id,
      content: msg.content,
      fromMe: msg.fromMe,
      timestamp: msg.timestamp,
      mediaType: msg.mediaType,
      mediaUrl: msg.mediaUrl,
      locationLatitude: msg.locationLatitude,
      locationLongitude: msg.locationLongitude,
      locationAddress: msg.locationAddress,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      reaction: msg.reaction,
      conversationId: msg.conversationId,
      contactId: msg.contactId,
      relevanceScore: this.calculateRelevanceScore(msg, filters),
      highlights
    };
  }

  // Transformar resultado de contacto
  private static transformContactResult(contact: any, filters: AdvancedSearchFilters): ContactSearchResult {
    const highlights = this.generateHighlights(contact, filters);
    
    return {
      id: contact.id,
      name: contact.name,
      number: contact.number,
      email: contact.email,
      avatar: contact.avatar,
      tags: contact.tags,
      conversationCount: contact.conversations.length,
      lastContactDate: contact.messages[0]?.createdAt || contact.createdAt,
      relevanceScore: this.calculateRelevanceScore(contact, filters),
      highlights
    };
  }

  // Generar highlights de texto
  private static generateHighlights(item: any, filters: AdvancedSearchFilters): string[] {
    const highlights: string[] = [];
    
    if (filters.search) {
      const searchTerms = filters.search.split(' ').filter(term => term.length > 0);
      
      searchTerms.forEach(term => {
        if (item.content && item.content.toLowerCase().includes(term.toLowerCase())) {
          highlights.push(this.highlightText(item.content, term));
        }
        if (item.name && item.name.toLowerCase().includes(term.toLowerCase())) {
          highlights.push(this.highlightText(item.name, term));
        }
      });
    }
    
    return highlights;
  }

  // Destacar texto
  private static highlightText(text: string, term: string): string {
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Calcular puntuación de relevancia
  private static calculateRelevanceScore(item: any, filters: AdvancedSearchFilters): number {
    let score = 0;
    
    if (filters.search) {
      const searchTerms = filters.search.split(' ').filter(term => term.length > 0);
      
      searchTerms.forEach(term => {
        if (item.content && item.content.toLowerCase().includes(term.toLowerCase())) {
          score += 10;
        }
        if (item.name && item.name.toLowerCase().includes(term.toLowerCase())) {
          score += 15;
        }
      });
    }
    
    return Math.min(score, 100);
  }

  // Obtener índices utilizados
  private static getIndexesUsed(filters: AdvancedSearchFilters): string[] {
    const indexes: string[] = [];
    
    if (filters.search) {
      indexes.push('content_search_idx');
    }
    if (filters.dateFrom || filters.dateTo) {
      indexes.push('timestamp_idx');
    }
    if (filters.agentId) {
      indexes.push('user_id_idx');
    }
    
    return indexes;
  }

  // Generar consultas sugeridas
  private static generateSuggestedQueries(filters: AdvancedSearchFilters): string[] {
    const suggestions: string[] = [];
    
    if (filters.search) {
      suggestions.push(`${filters.search} desde:ayer`);
      suggestions.push(`${filters.search} tipo:imagen`);
      suggestions.push(`${filters.search} agente:cualquiera`);
    }
    
    return suggestions;
  }

  // Exportar resultados de búsqueda
  static async exportResults(filters: AdvancedSearchFilters, format: 'csv' | 'json' | 'xlsx'): Promise<string> {
    try {
      const results = await this.search(filters);
      
      switch (format) {
        case 'csv':
          return this.exportToCSV(results);
        case 'json':
          return JSON.stringify(results, null, 2);
        case 'xlsx':
          return this.exportToXLSX(results);
        default:
          throw new Error('Formato no soportado');
      }
    } catch (error) {
      logger.error('Error exporting search results:', error);
      throw error;
    }
  }

  // Exportar a CSV
  private static exportToCSV(results: SearchResult): string {
    const headers = [
      'Tipo',
      'ID',
      'Contacto',
      'Contenido',
      'Fecha',
      'Agente',
      'Puntuación'
    ];
    
    const rows: string[] = [];
    
    results.conversations.forEach(conv => {
      rows.push([
        'Conversación',
        conv.id,
        conv.contact.name,
        conv.lastMessage?.content || '',
        conv.lastMessage?.timestamp.toISOString() || '',
        conv.user?.name || '',
        conv.relevanceScore.toString()
      ].join(','));
    });
    
    results.messages.forEach(msg => {
      rows.push([
        'Mensaje',
        msg.id,
        '', // Contacto se obtendría de la conversación
        msg.content,
        msg.timestamp.toISOString(),
        '',
        msg.relevanceScore.toString()
      ].join(','));
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  // Exportar a XLSX (placeholder)
  private static exportToXLSX(results: SearchResult): string {
    // Implementar exportación a Excel
    return JSON.stringify(results);
  }
} 