import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  MessageSquare, 
  Send, 
  MoreVertical, 
  RefreshCw, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Clock,
  Tag,
  ChevronUp,
  Users,
  Edit3
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import conversationService, { Conversation, Message } from '../services/conversationService';
import ConvertToTicketModal from '../components/ConvertToTicketModal';
import ConversationAssignmentModal from '../components/ConversationAssignmentModal';
import notificationService from '../services/notificationService';
import MessageTemplateSelector from '../components/MessageTemplateSelector';
import MessageTemplateManager from '../components/MessageTemplateManager';
import messageTemplateService, { MessageTemplate } from '../services/messageTemplateService';
import ConversationFilters from '../components/ConversationFilters';
import AgentStatusWidget from '../components/AgentStatusWidget';

const Conversations: React.FC = () => {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationFilters, setConversationFilters] = useState<any>({
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  const [conversationStats, setConversationStats] = useState<any>(null);
  const [showConvertToTicketModal, setShowConvertToTicketModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentModalMode, setAssignmentModalMode] = useState<'assign' | 'transfer'>('assign');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templateSelectorPosition, setTemplateSelectorPosition] = useState<{ top: number; left: number } | undefined>();
  
  // Refs para scroll y focus
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Función para ordenar mensajes por timestamp ascendente
  const sortMessages = useCallback((msgs: Message[]) => {
    return [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, []);

  // Función para scroll al final
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conversationService.getConversations(conversationFilters);
      setConversations(response.conversations || []);
      setConversationStats(response.stats || null);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Error al cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  }, [conversationFilters]);

  // Función para cargar mensajes con paginación
  const loadMessages = useCallback(async (conversationId: string, page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoadingMessages(true);
      } else {
        setLoadingMoreMessages(true);
      }
      
      const response = await conversationService.getMessages(conversationId, page, 50);
      const newMessages = response.messages || [];
      const total = response.pagination?.total || 0;
      
      setHasMoreMessages(newMessages.length === 50 && messages.length + newMessages.length < total);
      
      if (append) {
        setMessages(prev => sortMessages([...newMessages, ...prev]));
      } else {
        setMessages(sortMessages(newMessages));
        // Scroll al final solo cuando se cargan mensajes iniciales
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar los mensajes');
    } finally {
      setLoadingMessages(false);
      setLoadingMoreMessages(false);
    }
  }, [messages.length, sortMessages, scrollToBottom]);

  // Función para cargar más mensajes antiguos
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || loadingMoreMessages || !hasMoreMessages) return;
    
    const nextPage = currentPage + 1;
    await loadMessages(selectedConversation.id, nextPage, true);
  }, [selectedConversation, loadingMoreMessages, hasMoreMessages, currentPage, loadMessages]);

  // Función para detectar scroll hacia arriba para cargar más mensajes
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMoreMessages && !loadingMoreMessages) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadingMoreMessages, loadMoreMessages]);

  // Función para hacer focus en el input
  const focusInput = useCallback(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (socket) {
      console.log('[Socket] Configurando listeners para socket:', socket.id);
      
      const handleNewMessage = (newMessage: Message) => {
        // Si el mensaje es del usuario actual, ignorarlo porque ya se añadió de forma optimista.
        if (newMessage.fromMe) {
          return;
        }

        // Usar el servicio de notificaciones mejorado
        notificationService.sendNotification({
          type: 'message',
          title: `Nuevo mensaje de ${newMessage.contact.name}`,
          message: newMessage.content,
          userId: 'current', // Se obtendrá del contexto de auth
          companyId: 'current', // Se obtendrá del contexto de auth
          priority: 'medium',
          persistent: false,
          channels: ['websocket', 'push', 'desktop'],
          entityId: newMessage.conversationId,
          entityType: 'conversation'
        });
        
        setConversations(prev => {
          const convoIndex = prev.findIndex(c => c.id === newMessage.conversationId);
          if (convoIndex !== -1) {
            const updatedConvo = {
              ...prev[convoIndex],
              lastMessage: newMessage,
              unreadCount: (prev[convoIndex].unreadCount || 0) + 1,
              updatedAt: newMessage.timestamp,
            };
            const otherConvos = prev.filter(c => c.id !== newMessage.conversationId);
            return [updatedConvo, ...otherConvos];
          } else {
            loadConversations();
            return prev;
          }
        });

        if (selectedConversation?.id === newMessage.conversationId) {
          setMessages(prev => sortMessages([...prev, newMessage]));
          // Scroll al final cuando llega un nuevo mensaje
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      };

      // Listener para asignación de conversaciones
      const handleConversationAssigned = (data: any) => {
        console.log('[Socket] Conversación asignada:', data);
        toast.success(`Conversación asignada a ${data.agent.name}`);
        loadConversations();
      };

      // Listener para transferencia de conversaciones
      const handleConversationTransferred = (data: any) => {
        console.log('[Socket] Conversación transferida:', data);
        toast.success(`Conversación transferida de ${data.from.name} a ${data.to.name}`);
        loadConversations();
      };

      // Listener para nuevas asignaciones (al usuario actual)
      const handleNewConversationAssigned = (data: any) => {
        console.log('[Socket] Nueva conversación asignada:', data);
        notificationService.sendNotification({
          type: 'assignment',
          title: 'Conversación asignada',
          message: `Te han asignado una conversación con ${data.conversation.contact.name}`,
          userId: 'current',
          companyId: 'current',
          priority: 'high',
          persistent: true,
          channels: ['websocket', 'push', 'desktop'],
          entityId: data.conversation.id,
          entityType: 'conversation'
        });
        loadConversations();
      };

      // Listener para transferencias entrantes (al usuario actual)
      const handleConversationTransferredIn = (data: any) => {
        console.log('[Socket] Conversación transferida a mí:', data);
        notificationService.sendNotification({
          type: 'assignment',
          title: 'Conversación transferida',
          message: `${data.from?.name || 'Agente'} te ha transferido una conversación con ${data.conversation.contact.name}`,
          userId: 'current',
          companyId: 'current',
          priority: 'high',
          persistent: true,
          channels: ['websocket', 'push', 'desktop'],
          entityId: data.conversation.id,
          entityType: 'conversation'
        });
        loadConversations();
      };

      // Listener para actualizaciones de mensajes (ej. reacciones y estados)
      const handleMessageUpdated = (updatedMessage: Message) => {
        console.log('[Socket][messageUpdated] Recibido:', updatedMessage);
        console.log('[Socket][messageUpdated] Status del mensaje:', updatedMessage.status);
        console.log('[Socket][messageUpdated] ID del mensaje:', updatedMessage.id);
        console.log('[Socket][messageUpdated] fromMe:', updatedMessage.fromMe);
        console.log('[Socket][messageUpdated] Timestamp:', new Date().toISOString());
        
        // Solo procesar actualizaciones de mensajes enviados por el usuario
        if (!updatedMessage.fromMe) {
          console.log('[Socket][messageUpdated] Ignorando actualización de mensaje recibido');
          return;
        }
        
        // Usar función de actualización para asegurar que tenemos el estado más reciente
        setMessages(prev => {
          const existingMessageIndex = prev.findIndex(msg => msg.id === updatedMessage.id);
          if (existingMessageIndex === -1) {
            console.log('[Socket][messageUpdated] Mensaje no encontrado en el estado actual, ignorando');
            console.log('[Socket][messageUpdated] Mensajes actuales:', prev.map(m => ({ id: m.id, status: m.status })));
            return prev;
          }
          
          const oldMessage = prev[existingMessageIndex];
          console.log('[Socket][messageUpdated] Mensaje encontrado en índice:', existingMessageIndex);
          console.log('[Socket][messageUpdated] Estado anterior:', oldMessage.status);
          console.log('[Socket][messageUpdated] Estado nuevo:', updatedMessage.status);
          
          const updated = [...prev];
          updated[existingMessageIndex] = { ...updated[existingMessageIndex], ...updatedMessage };
          console.log('[Socket][messageUpdated] Mensaje actualizado exitosamente');
          return sortMessages(updated);
        });

        // Actualizar también el último mensaje en la lista de conversaciones
        setConversations(prev =>
          prev.map(c =>
            c.lastMessage?.id === updatedMessage.id
              ? { ...c, lastMessage: { ...c.lastMessage, ...updatedMessage } }
              : c
          )
        );
      };

      // Limpiar listeners anteriores antes de agregar nuevos
      socket.off('newMessage');
      socket.off('messageUpdated');
      socket.off('conversationAssigned');
      socket.off('conversationTransferred');
      socket.off('newConversationAssigned');
      socket.off('conversationTransferredIn');
      
      // Agregar nuevos listeners
      socket.on('newMessage', handleNewMessage);
      socket.on('messageUpdated', handleMessageUpdated);
      socket.on('conversationAssigned', handleConversationAssigned);
      socket.on('conversationTransferred', handleConversationTransferred);
      socket.on('newConversationAssigned', handleNewConversationAssigned);
      socket.on('conversationTransferredIn', handleConversationTransferredIn);

      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('messageUpdated', handleMessageUpdated);
        socket.off('conversationAssigned', handleConversationAssigned);
        socket.off('conversationTransferred', handleConversationTransferred);
        socket.off('newConversationAssigned', handleNewConversationAssigned);
        socket.off('conversationTransferredIn', handleConversationTransferredIn);
      };
    }
  }, [socket, selectedConversation?.id, loadConversations, scrollToBottom, sortMessages]); // Remover loadConversations de las dependencias

  const sortedConversations = [...conversations].sort((a, b) => {
    const aIsUnread = a.unreadCount > 0;
    const bIsUnread = b.unreadCount > 0;
    if (aIsUnread !== bIsUnread) {
      return aIsUnread ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleSelectConversation = async (conversation: Conversation) => {
    if (loadingMessages) return;
    try {
      setSelectedConversation(conversation);
      setCurrentPage(1);
      setHasMoreMessages(true);
      
      // Cargar los primeros 50 mensajes
      await loadMessages(conversation.id, 1, false);
      
      // Hacer focus en el input después de cargar los mensajes
      focusInput();
      
      if (conversation.unreadCount > 0) {
        // Actualizar localmente y luego notificar al backend
        setConversations(prev => 
          prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
        );
        try {
          await conversationService.markAsRead(conversation.id);
        } catch (error) {
          console.error('Error marking conversation as read:', error);
          // Opcional: revertir el estado local si la API falla
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar los mensajes');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      // Procesar atajos de plantillas antes de enviar
      const shortcutProcessed = await handleTemplateShortcut(newMessage);
      const messageToSend = shortcutProcessed ? newMessage : newMessage;
      
      const response = await conversationService.sendMessage(
        selectedConversation.id,
        messageToSend
      );
      setMessages(prev => sortMessages([...prev, response]));
      setNewMessage('');

      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, lastMessage: response, updatedAt: response.timestamp }
          : c
      ));
      
      // Scroll al final después de enviar mensaje
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      // Hacer focus en el input después de enviar
      focusInput();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusIcon = React.useCallback((status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAssignConversation = () => {
    setAssignmentModalMode('assign');
    setShowAssignmentModal(true);
  };

  const handleTransferConversation = () => {
    setAssignmentModalMode('transfer');
    setShowAssignmentModal(true);
  };

  // Funciones para plantillas de mensajes
  const handleTemplateSelect = useCallback((template: MessageTemplate) => {
    setNewMessage(template.content);
    setShowTemplateSelector(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleShowTemplateSelector = useCallback(() => {
    setShowTemplateSelector(true);
    setTemplateSelectorPosition(undefined);
  }, []);

  const handleTemplateShortcut = useCallback(async (message: string) => {
    // Buscar atajos en el mensaje
    const shortcutMatch = message.match(/^\/(\w+)/);
    if (shortcutMatch) {
      const shortcut = `/${shortcutMatch[1]}`;
      try {
        const template = await messageTemplateService.getTemplateByShortcut(shortcut);
        if (template) {
          // Reemplazar el shortcut con el contenido de la plantilla
          const newMessage = message.replace(shortcut, template.content);
          setNewMessage(newMessage);
          // Incrementar contador de uso
          await messageTemplateService.incrementUsage(template.id);
          return true;
        }
      } catch (error) {
        console.error('Error processing template shortcut:', error);
      }
    }
    return false;
  }, []);

  const handleConvertToTicket = async () => {
    if (!selectedConversation) return;
    
    try {
      await conversationService.convertToTicket(selectedConversation.id, ['Ticket from conversation']);
      setShowConvertToTicketModal(false);
      // Recargar conversaciones
      loadConversations();
    } catch (error) {
      console.error('Error converting to ticket:', error);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Lista de conversaciones */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Conversaciones
            </h1>
            <div className="flex items-center space-x-2">
              <AgentStatusWidget compact={true} showTeamStats={false} />
              <button onClick={loadConversations} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Filtros Avanzados */}
        <ConversationFilters
          onFiltersChange={setConversationFilters}
          initialFilters={conversationFilters}
          stats={conversationStats}
        />

        {/* Lista de conversaciones */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p>No hay conversaciones</p>
            </div>
          ) : (
            sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {conversation.contact.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">
                      {conversation.contact.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      {conversation.lastMessage?.content || '...'}
                    </p>
                    {conversation.ticket && conversation.ticket.tags && conversation.ticket.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {conversation.ticket.tags.slice(0, 2).map((tag: any) => (
                          <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {tag.attribute}: {tag.value}
                          </span>
                        ))}
                        {conversation.ticket.tags.length > 2 && (
                          <div className="relative group">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 cursor-pointer">+{conversation.ticket.tags.length - 2}</span>
                            <div className="absolute left-0 z-10 hidden group-hover:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg p-2 mt-1 min-w-max">
                              {conversation.ticket.tags.slice(2).map((tag: any) => (
                                <div key={tag.id} className="text-xs text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                  {tag.attribute}: {tag.value}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatTime(conversation.updatedAt)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat principal */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {loadingMessages ? (
           <div className="flex-1 flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
           </div>
        ) : selectedConversation ? (
          <>
            {/* Header de la conversación seleccionada */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 flex-shrink-0">
                  {/* Aquí podría ir un avatar */}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">{selectedConversation.contact.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedConversation.contact.number} | en {selectedConversation.connection.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selectedConversation.ticket && (
                  <button
                    onClick={() => setShowConvertToTicketModal(true)}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Convertir a Ticket
                  </button>
                )}
                
                {!selectedConversation.user && (
                  <button
                    onClick={handleAssignConversation}
                    className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Asignar
                  </button>
                )}
                
                {selectedConversation.user && (
                  <button
                    onClick={handleTransferConversation}
                    className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Transferir
                  </button>
                )}
              </div>
            </div>

            {/* Lista de mensajes con scroll infinito */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-grow p-4 overflow-y-auto bg-gray-100 dark:bg-gray-800"
            >
              {/* Indicador de carga de mensajes antiguos */}
              {loadingMoreMessages && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Cargando mensajes anteriores...</span>
                  </div>
                </div>
              )}
              
              {/* Botón para cargar más mensajes */}
              {hasMoreMessages && !loadingMoreMessages && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreMessages}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>Cargar mensajes anteriores</span>
                  </button>
                </div>
              )}
              
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-xl px-4 py-2 text-white relative ${
                        msg.fromMe
                          ? 'bg-blue-500 rounded-br-none'
                          : 'bg-gray-400 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-white mr-2">
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.fromMe && getStatusIcon(msg.status)}
                      </div>
                      {/* Mostrar reacción si existe */}
                      {msg.reaction && (
                        <div className={`absolute -bottom-2 ${msg.fromMe ? '-left-2' : '-right-2'} bg-white dark:bg-gray-800 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-600`}>
                          <span className="text-lg" title={`Reacción: ${msg.reaction}`}>
                            {msg.reaction}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input para nuevo mensaje */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={sendingMessage || loadingMessages}
                />
                <button
                  onClick={handleShowTemplateSelector}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Usar plantilla"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowTemplateManager(true)}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Gestionar plantillas"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage || loadingMessages}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400" />
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Selecciona una conversación</h2>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Elige una conversación de la lista para ver los mensajes.</p>
            </div>
          </div>
        )}
      </div>

      <ConvertToTicketModal
        isOpen={showConvertToTicketModal}
        onClose={() => setShowConvertToTicketModal(false)}
        onConvert={handleConvertToTicket}
        contactName={selectedConversation?.contact.name || ''}
      />

      {/* Modal de asignación de conversación */}
      {selectedConversation && (
        <ConversationAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          conversationId={selectedConversation.id}
          currentAgentId={selectedConversation.user?.id}
          currentAgentName={selectedConversation.user?.name}
          contactName={selectedConversation.contact.name}
          mode={assignmentModalMode}
        />
      )}

      {/* Selector de plantillas */}
      <MessageTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
        currentMessage={newMessage}
        position={templateSelectorPosition}
      />

      {/* Gestor de plantillas */}
      <MessageTemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
      />
    </div>
  );
};

export default Conversations; 