import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  fromMe: boolean;
  mediaType: string;
  mediaUrl?: string;
  createdAt: Date;
  userId?: string;
  isRead: boolean;
  reactions?: any[];
  mediaFiles?: any[];
}

interface MessageWithMetadata extends Message {
  index: number;
  isFirstFromUser: boolean;
  isLastFromUser: boolean;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  loading,
  hasMore,
  onLoadMore
}) => {
  const [displayMessages, setDisplayMessages] = useState<MessageWithMetadata[]>([]);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>();

  // Memoizar mensajes para evitar re-renders innecesarios
  const memoizedMessages = useMemo(() => {
    return messages.map((message, index) => ({
      ...message,
      index,
      isFirstFromUser: index === 0 || messages[index - 1].fromMe !== message.fromMe,
      isLastFromUser: index === messages.length - 1 || messages[index + 1]?.fromMe !== message.fromMe
    }));
  }, [messages]);

  // Actualizar mensajes mostrados
  useEffect(() => {
    setDisplayMessages(memoizedMessages);
  }, [memoizedMessages]);

  // Scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (isAtBottom && !isUserScrolling && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, isUserScrolling]);

  // Detectar scroll del usuario
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Detectar si está al final
    const isBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setIsAtBottom(isBottom);
    setShowScrollToBottom(!isBottom);

    // Marcar como scrolling del usuario
    setIsUserScrolling(true);
    
    // Resetear flag después de 2 segundos
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 2000);

    // Cargar más mensajes si está cerca del top
    if (scrollTop < 200 && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  // Función para hacer scroll al final
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Función para hacer scroll suave al final
  const scrollToBottomSmooth = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Renderizar mensaje individual
  const renderMessage = useCallback((message: MessageWithMetadata) => {
    const timestamp = new Date(message.createdAt).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div
        key={message.id}
        className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            message.fromMe
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          <div className="break-words">
            {message.mediaUrl && (
              <div className="mb-2">
                {message.mediaType === 'image' ? (
                  <img 
                    src={message.mediaUrl} 
                    alt="Media" 
                    className="max-w-full h-auto rounded"
                  />
                ) : (
                  <a 
                    href={message.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 underline"
                  >
                    Ver archivo
                  </a>
                )}
              </div>
            )}
            <p className="text-sm">{message.content}</p>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs opacity-70">{timestamp}</span>
            {message.fromMe && (
              <span className="text-xs opacity-70">
                {message.isRead ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Contenedor de mensajes */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-2 scroll-smooth"
        onScroll={handleScroll}
      >
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        <div className="space-y-2">
          {displayMessages.map((message) => renderMessage(message))}
        </div>
        
        {displayMessages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No hay mensajes en esta conversación</p>
          </div>
        )}
      </div>

      {/* Botón para scroll al final */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottomSmooth}
          className="absolute bottom-4 right-4 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default VirtualizedMessageList; 