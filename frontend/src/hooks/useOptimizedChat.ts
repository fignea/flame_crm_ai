import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import conversationService from '../services/conversationService';

// Interfaces actualizadas
interface Message {
  id: string;
  conversationId: string;
  content: string;
  fromMe: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  mediaUrl?: string;
  timestamp?: string;
  reaction?: string;
  
  // Nuevos campos para mensajes avanzados
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  metadata?: any;
  
  // Timestamps de estados
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  
  // Campos adicionales
  createdAt: Date;
  isRead: boolean;
}

interface ConversationSummary {
  id: string;
  lastMessage?: Message;
  unreadCount: number;
  contact: {
    id: string;
    name: string;
    number: string;
    avatar?: string;
  };
}

interface OptimizedChatHook {
  // Estado principal
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  
  // Conversaciones
  conversations: ConversationSummary[];
  conversationsLoading: boolean;
  
  // Conversación actual
  currentConversation: string | null;
  isTyping: boolean;
  
  // Acciones
  loadMessages: (conversationId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, mediaType?: string, mediaUrl?: string) => Promise<void>;
  sendLocationMessage: (latitude: number, longitude: number, address?: string) => Promise<void>;
  sendFileMessage: (file: File, fileType: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
  setCurrentConversation: (id: string | null) => void;
  
  // Utilidades
  formatFileSize: (size: number) => string;
  isLocationMessage: (message: Message) => boolean;
  isFileMessage: (message: Message) => boolean;
}

export const useOptimizedChat = (): OptimizedChatHook => {
  const socket = useSocket();
  
  // Estado principal
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Conversaciones
  const [conversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading] = useState(false);
  
  // Conversación actual
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Optimización
  const [messageBuffer, setMessageBuffer] = useState<Message[]>([]);
  const messagesCache = useRef<Map<string, Message[]>>(new Map());
  const paginationCache = useRef<Map<string, { page: number; hasMore: boolean }>>(new Map());
  
  // Refs para timeouts
  const typingTimeoutRef = useRef<number | undefined>();
  const bufferTimeoutRef = useRef<number | undefined>();
  
  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (conversationId: string) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Verificar caché primero
      const cached = messagesCache.current.get(conversationId);
      if (cached) {
        setMessages(cached);
        setLoading(false);
        return;
      }
      
      const response = await conversationService.getMessages(conversationId, 1, 50);
      setMessages(response.messages);
      setHasMore(response.hasMore);
      
      // Guardar en caché
      messagesCache.current.set(conversationId, response.messages);
      paginationCache.current.set(conversationId, { 
        page: response.page, 
        hasMore: response.hasMore 
      });
      
    } catch (error: any) {
      setError(error.message || 'Error cargando mensajes');
    } finally {
      setLoading(false);
    }
  }, [loading]);
  
  // Cargar más mensajes
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || loading || !hasMore) return;
    
    try {
      setLoading(true);
      const pagination = paginationCache.current.get(currentConversation);
      const nextPage = pagination ? pagination.page + 1 : 2;
      
      const response = await conversationService.getMessages(currentConversation, nextPage, 50);
      
      const newMessages = [...response.messages, ...messages];
      setMessages(newMessages);
      setHasMore(response.hasMore);
      
      // Actualizar caché
      messagesCache.current.set(currentConversation, newMessages);
      paginationCache.current.set(currentConversation, { 
        page: response.page, 
        hasMore: response.hasMore 
      });
      
    } catch (error: any) {
      setError(error.message || 'Error cargando más mensajes');
    } finally {
      setLoading(false);
    }
  }, [currentConversation, loading, hasMore, messages]);
  
  // Enviar mensaje
  const sendMessage = useCallback(async (content: string, mediaType?: string, mediaUrl?: string) => {
    if (!currentConversation || !socket?.isConnected) return;
    
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content,
      fromMe: true,
      status: 'sent',
      mediaType: (mediaType as 'text' | 'image' | 'video' | 'audio' | 'document' | 'location') || 'text',
      mediaUrl,
      createdAt: new Date(),
      isRead: false,
      conversationId: currentConversation
    };
    
    // Agregar mensaje optimista
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      socket.socket?.emit('send_message', {
        conversationId: currentConversation,
        content,
        mediaType,
        mediaUrl
      });
    } catch (error: any) {
      setError(error.message || 'Error enviando mensaje');
      // Remover mensaje optimista en caso de error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  }, [currentConversation, socket]);
  
  // Marcar como leído
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!socket?.isConnected) return;
    
    try {
      socket.socket?.emit('mark_read', { conversationId });
      
      // Actualizar mensajes localmente
      setMessages(prev => prev.map(msg => 
        msg.conversationId === conversationId ? { ...msg, isRead: true } : msg
      ));
      
    } catch (error: any) {
      setError(error.message || 'Error marcando como leído');
    }
  }, [socket]);
  
  // Enviar mensaje de ubicación
  const sendLocationMessage = useCallback(async (latitude: number, longitude: number, address?: string) => {
    if (!currentConversation || !socket?.isConnected) return;
    
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content: address || `Ubicación: ${latitude}, ${longitude}`,
      fromMe: true,
      status: 'sent',
      mediaType: 'location',
      locationLatitude: latitude,
      locationLongitude: longitude,
      locationAddress: address,
      createdAt: new Date(),
      isRead: false,
      conversationId: currentConversation
    };
    
    // Agregar mensaje optimista
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      socket.socket?.emit('send_message', {
        conversationId: currentConversation,
        content: address || `Ubicación: ${latitude}, ${longitude}`,
        mediaType: 'location',
        locationLatitude: latitude,
        locationLongitude: longitude,
        locationAddress: address
      });
    } catch (error: any) {
      setError(error.message || 'Error enviando ubicación');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  }, [currentConversation, socket]);
  
  // Enviar archivo
  const sendFileMessage = useCallback(async (file: File, fileType: string) => {
    if (!currentConversation || !socket?.isConnected) return;
    
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content: file.name,
      fromMe: true,
      status: 'sent',
      mediaType: fileType as 'document' | 'image' | 'video' | 'audio',
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type,
      createdAt: new Date(),
      isRead: false,
      conversationId: currentConversation
    };
    
    // Agregar mensaje optimista
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      // Aquí implementarías la lógica de subida de archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', currentConversation);
      formData.append('fileType', fileType);
      
      // Por ahora, emitimos con socket
      socket.socket?.emit('send_file', {
        conversationId: currentConversation,
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: file.type,
        fileType: fileType
      });
    } catch (error: any) {
      setError(error.message || 'Error enviando archivo');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  }, [currentConversation, socket]);
  
  // Utilidades
  const formatFileSize = useCallback((size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, []);
  
  const isLocationMessage = useCallback((message: Message): boolean => {
    return message.mediaType === 'location' || (message.locationLatitude !== undefined && message.locationLongitude !== undefined);
  }, []);
  
  const isFileMessage = useCallback((message: Message): boolean => {
    return ['document', 'audio', 'video', 'image'].includes(message.mediaType || '');
  }, []);
  
  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageBuffer([]);
    messagesCache.current.clear();
    paginationCache.current.clear();
  }, []);

  // Procesar buffer de mensajes
  const processBuffer = useCallback(() => {
    if (messageBuffer.length === 0) return;
    
    setMessages(prev => {
      const newMessages = [...prev];
      
      messageBuffer.forEach(bufferedMessage => {
        const existingIndex = newMessages.findIndex(msg => msg.id === bufferedMessage.id);
        if (existingIndex >= 0) {
          newMessages[existingIndex] = bufferedMessage;
        } else {
          newMessages.push(bufferedMessage);
        }
      });
      
      return newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    
    setMessageBuffer([]);
  }, [messageBuffer]);
  
  // Configurar listeners de socket
  useEffect(() => {
    if (!socket?.socket) return;
    
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === currentConversation) {
        // Agregar al buffer para procesamiento optimizado
        setMessageBuffer(prev => [...prev, message]);
      }
    };
    
    const handleMessageSent = (message: Message) => {
      if (message.conversationId === currentConversation) {
        setMessages(prev => prev.map(msg => 
          msg.id.startsWith('temp_') ? message : msg
        ));
      }
    };
    
    const handleTypingStart = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === currentConversation) {
        setIsTyping(true);
      }
    };
    
    const handleTypingStop = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === currentConversation) {
        setIsTyping(false);
      }
    };
    
    socket.socket.on('new_message', handleNewMessage);
    socket.socket.on('message_sent', handleMessageSent);
    socket.socket.on('user_typing', handleTypingStart);
    socket.socket.on('user_stopped_typing', handleTypingStop);
    
    return () => {
      socket.socket?.off('new_message', handleNewMessage);
      socket.socket?.off('message_sent', handleMessageSent);
      socket.socket?.off('user_typing', handleTypingStart);
      socket.socket?.off('user_stopped_typing', handleTypingStop);
    };
  }, [socket, currentConversation]);
  
  // Procesar buffer periódicamente
  useEffect(() => {
    if (messageBuffer.length > 0) {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
      
      bufferTimeoutRef.current = setTimeout(processBuffer, 500) as any;
    }
    
    return () => {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, [messageBuffer, processBuffer]);
  
  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    messages,
    loading,
    hasMore,
    error,
    conversations,
    conversationsLoading,
    currentConversation,
    isTyping,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    setCurrentConversation,
    clearMessages,
    sendLocationMessage,
    sendFileMessage,
    formatFileSize,
    isLocationMessage,
    isFileMessage
  };
};

export default useOptimizedChat; 