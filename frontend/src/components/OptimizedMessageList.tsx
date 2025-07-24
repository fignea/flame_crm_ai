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

interface OptimizedMessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMessageClick?: (message: Message) => void;
  onScroll?: (scrollTop: number) => void;
  autoScrollToBottom?: boolean;
  currentUserId?: string;
  className?: string;
}

// Componente individual de mensaje optimizado
const MessageItem = React.memo<{
  message: Message;
  isOwnMessage: boolean;
  showTimestamp: boolean;
  onClick?: (message: Message) => void;
}>(({ message, isOwnMessage, showTimestamp, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleClick = useCallback(() => {
    onClick?.(message);
  }, [onClick, message]);

  const messageTime = useMemo(() => {
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }, [message.createdAt]);

  const renderMessageContent = () => {
    switch (message.mediaType) {
      case 'image':
        return (
          <div className="message-image">
            {!imageLoaded && !imageError && (
              <div className="w-48 h-32 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Cargando imagen...</div>
              </div>
            )}
            {imageError && (
              <div className="w-48 h-32 bg-red-100 rounded-lg flex items-center justify-center">
                <div className="text-red-500">Error al cargar imagen</div>
              </div>
            )}
            <img
              src={message.mediaUrl}
              alt="Imagen"
              className={`max-w-xs rounded-lg cursor-pointer transition-opacity ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={handleClick}
              loading="lazy"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="message-video">
            <video
              src={message.mediaUrl}
              controls
              className="max-w-xs rounded-lg"
              preload="metadata"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="message-audio">
            <audio
              src={message.mediaUrl}
              controls
              className="w-64"
              preload="metadata"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="message-document">
            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {message.mediaFiles?.[0]?.fileName || 'Documento'}
                </p>
                <p className="text-xs text-gray-500">
                  {message.mediaFiles?.[0]?.fileSize 
                    ? `${Math.round(message.mediaFiles[0].fileSize / 1024)} KB`
                    : 'Tamaño desconocido'
                  }
                </p>
              </div>
              <a
                href={message.mediaUrl}
                download
                className="flex-shrink-0 text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      default:
        return <p className="text-sm break-words">{message.content}</p>;
    }
  };

  return (
    <div className={`message-item px-4 py-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} flex`}>
      <div className={`max-w-xs lg:max-w-md relative ${
        isOwnMessage 
          ? 'bg-blue-500 text-white ml-auto' 
          : 'bg-white text-gray-900 mr-auto'
      } rounded-lg p-3 shadow-sm`}>
        {renderMessageContent()}
        
        {/* Reacciones */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
              >
                {reaction.emoji} {reaction.count > 1 && reaction.count}
              </span>
            ))}
          </div>
        )}
        
        {/* Timestamp y estado */}
        <div className={`flex items-center justify-between mt-2 text-xs ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {showTimestamp && (
            <span className="timestamp">{messageTime}</span>
          )}
          {isOwnMessage && (
            <div className="flex items-center space-x-1">
              {message.isRead ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Componente de lista optimizada
const OptimizedMessageList: React.FC<OptimizedMessageListProps> = ({
  messages,
  loading,
  hasMore,
  onLoadMore,
  onMessageClick,
  onScroll,
  autoScrollToBottom = true,
  currentUserId,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [renderedRange, setRenderedRange] = useState({ start: 0, end: 50 });
  const lastMessageCount = useRef(messages.length);
  const loadingRef = useRef(false);

  // Implementación de scroll infinito
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, clientHeight } = container;
    
    setIsUserScrolling(true);
    
    // Resetear flag después de 2 segundos
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 2000);

    // Cargar más mensajes cuando se acerque al top
    if (scrollTop < 100 && hasMore && !loadingRef.current) {
      loadingRef.current = true;
      onLoadMore();
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }

    // Virtualización simple - renderizar solo mensajes visibles
    const itemHeight = 100; // Altura estimada por mensaje
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(clientHeight / itemHeight) + 5,
      messages.length
    );

    setRenderedRange({
      start: Math.max(0, startIndex - 5),
      end: endIndex
    });

    onScroll?.(scrollTop);
  }, [hasMore, onLoadMore, onScroll, messages.length]);

  // Scroll automático al final
  useEffect(() => {
    if (autoScrollToBottom && !isUserScrolling && containerRef.current) {
      const newMessageCount = messages.length;
      const hasNewMessages = newMessageCount > lastMessageCount.current;
      
      if (hasNewMessages) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        lastMessageCount.current = newMessageCount;
      }
    }
  }, [messages.length, autoScrollToBottom, isUserScrolling]);

  // Mensajes a renderizar (con virtualización simple)
  const visibleMessages = useMemo(() => {
    return messages.slice(renderedRange.start, renderedRange.end);
  }, [messages, renderedRange]);

  return (
    <div className={`optimized-message-list ${className} h-full relative`}>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scroll-smooth"
        onScroll={handleScroll}
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Espaciador para elementos no renderizados al inicio */}
        {renderedRange.start > 0 && (
          <div style={{ height: renderedRange.start * 100 }} />
        )}

        {/* Indicador de carga al inicio */}
        {loading && (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Cargando mensajes...</span>
          </div>
        )}

        {/* Mensajes visibles */}
        {visibleMessages.map((message, index) => {
          const actualIndex = renderedRange.start + index;
          const isOwnMessage = message.userId === currentUserId;
          const showTimestamp = actualIndex === 0 || 
            (messages[actualIndex - 1] && 
             new Date(message.createdAt).getTime() - new Date(messages[actualIndex - 1].createdAt).getTime() > 5 * 60 * 1000);

          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              showTimestamp={showTimestamp}
              onClick={onMessageClick}
            />
          );
        })}

        {/* Espaciador para elementos no renderizados al final */}
        {renderedRange.end < messages.length && (
          <div style={{ height: (messages.length - renderedRange.end) * 100 }} />
        )}

        {/* Mensaje de fin de conversación */}
        {!hasMore && messages.length > 0 && (
          <div className="text-center p-4 text-gray-500 text-sm">
            Inicio de la conversación
          </div>
        )}
      </div>

      {/* Botón para ir al final */}
      {isUserScrolling && (
        <button
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }}
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

export default OptimizedMessageList; 