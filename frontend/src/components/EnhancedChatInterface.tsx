import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Info, 
  Search, 
  MoreVertical, 
  ChevronDown,
  MessageSquare,
  X,
  Loader,
  Check,
  CheckCheck,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import { MessageControls } from './MessageControls';
import conversationService from '../services/conversationService';

interface Message {
  id: string;
  content: string;
  fromMe: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  mediaUrl?: string;
  timestamp: string;
  reaction?: string;
  conversationId?: string;
  
  // Campos avanzados
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  metadata?: any;
  
  // Timestamps de estado
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  
  contact: {
    id: string;
    name: string;
    number: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  contact: {
    id: string;
    name: string;
    number: string;
    avatar?: string;
    lastSeen?: string;
    isOnline?: boolean;
  };
  connection: {
    id: string;
    name: string;
    type: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  unreadCount: number;
  lastMessage?: string;
  updatedAt: string;
}

interface EnhancedChatInterfaceProps {
  conversation: Conversation;
  onClose?: () => void;
  className?: string;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({ 
  conversation, 
  onClose, 
  className 
}) => {
  const { socket } = useSocket();
  
  // Estado del chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactTyping, setContactTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Estado de la interfaz
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  
  // Estado de medios
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Cargar mensajes
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conversationService.getMessages(conversation.id);
      setMessages(response.messages || []);
      
      // Marcar como leídos
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  // Enviar mensaje
  const sendMessage = async (content: string, mediaType?: string, mediaFile?: File) => {
    if (!content.trim() && !mediaFile) return;
    
    try {
      setSending(true);
      
      // Crear mensaje temporal
      const tempMessage: Message = {
        id: `temp_${Date.now()}`,
        content,
        fromMe: true,
        status: 'sending',
        mediaType: mediaType as any,
        timestamp: new Date().toISOString(),
        contact: conversation.contact
      };
      
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();
      
      // Enviar al servidor
      const response = await conversationService.sendMessage(conversation.id, content);
      
      // Actualizar mensaje temporal con respuesta real
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...response, status: 'sent' }
          : msg
      ));
      
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar mensaje');
      
      // Marcar mensaje como fallido
      setMessages(prev => prev.map(msg => 
        msg.id === `temp_${Date.now()}` 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  // Scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Manejar scroll
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
      setIsScrolledToBottom(isAtBottom);
    }
  };

  // Buscar mensajes
  const searchMessages = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = messages.filter(msg => 
      msg.content.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  // Obtener icono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Loader className="w-3 h-3 animate-spin text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  // Formatear hora
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Efectos
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleTypingStart = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === conversation.id) {
        setContactTyping(true);
      }
    };

    const handleTypingStop = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === conversation.id) {
        setContactTyping(false);
      }
    };

    const handleMessageUpdate = (message: Message) => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? message : msg
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_update', handleMessageUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_update', handleMessageUpdate);
    };
  }, [socket, conversation.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              {conversation.contact.avatar ? (
                <img 
                  src={conversation.contact.avatar} 
                  alt={conversation.contact.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {conversation.contact.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {conversation.contact.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {conversation.contact.name}
            </h3>
            <p className="text-sm text-gray-500">
              {contactTyping ? (
                <span className="text-green-600">Escribiendo...</span>
              ) : conversation.contact.lastSeen ? (
                `Última vez: ${new Date(conversation.contact.lastSeen).toLocaleString()}`
              ) : (
                conversation.contact.number
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowContactInfo(!showContactInfo)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            <Info className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda */}
      {showSearch && (
        <div className="p-3 border-b border-gray-200 bg-yellow-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar en mensajes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchMessages(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {searchResults.length} resultado(s) encontrado(s)
            </div>
          )}
        </div>
      )}

      {/* Mensajes */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium">No hay mensajes</p>
            <p className="text-sm">Inicia una conversación enviando un mensaje</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.fromMe
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } ${
                    searchResults.some(r => r.id === message.id) 
                      ? 'ring-2 ring-yellow-400' 
                      : ''
                  }`}
                >
                  {/* Contenido del mensaje */}
                  <div className="mb-2">
                    {message.content}
                  </div>
                  
                  {/* Información del mensaje */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-75">
                      {formatTime(message.timestamp)}
                    </span>
                    
                    {message.fromMe && (
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                  
                  {/* Reacción */}
                  {message.reaction && (
                    <div className="mt-1 text-lg">
                      {message.reaction}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Indicador de typing */}
            {contactTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Botón scroll to bottom */}
      {!isScrolledToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Input de mensaje */}
      <div className="border-t border-gray-200 bg-white">
        <MessageControls
          onSendMessage={(content, mediaType, mediaUrl) => 
            sendMessage(content, mediaType, mediaUrl as any)
          }
          onSendLocation={(latitude, longitude, address) => 
            sendMessage(address || `${latitude}, ${longitude}`, 'location')
          }
          onSendFile={(file, fileType) => 
            sendMessage(file.name, fileType, file as any)
          }
          disabled={sending}
        />
      </div>

      {/* Preview de imagen */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-screen">
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatInterface; 