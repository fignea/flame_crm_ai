import React from 'react';
import { 
  WifiOff, 
  Clock, 
  Check, 
  CheckCheck, 
  XCircle, 
  Loader,
  Signal,
  SignalHigh,
  SignalLow,
  Battery,
  BatteryLow
} from 'lucide-react';

// Indicador de conexión
interface ConnectionStatusProps {
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  lastConnected?: Date;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionQuality,
  lastConnected,
  className = ''
}) => {
  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="w-4 h-4 text-red-500" />;
    
    switch (connectionQuality) {
      case 'excellent':
        return <Signal className="w-4 h-4 text-green-500" />;
      case 'good':
        return <SignalHigh className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <SignalLow className="w-4 h-4 text-orange-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!isConnected) {
      return lastConnected 
        ? `Desconectado desde ${lastConnected.toLocaleTimeString()}`
        : 'Desconectado';
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return 'Conexión excelente';
      case 'good':
        return 'Conexión buena';
      case 'poor':
        return 'Conexión lenta';
      default:
        return 'Conectado';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getConnectionIcon()}
      <span className="text-sm text-gray-600">{getStatusText()}</span>
    </div>
  );
};

// Indicador de typing
interface TypingIndicatorProps {
  isTyping: boolean;
  users: Array<{ name: string; avatar?: string }>;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping,
  users,
  className = ''
}) => {
  if (!isTyping || users.length === 0) return null;

  return (
    <div className={`flex items-center space-x-2 p-2 ${className}`}>
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={index}
            className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
        </div>
        <span className="text-sm text-gray-600">
          {users.length === 1 
            ? `${users[0].name} está escribiendo...`
            : `${users.length} personas están escribiendo...`
          }
        </span>
      </div>
    </div>
  );
};

// Indicador de estado de mensaje
interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: Date;
  showTimestamp?: boolean;
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  timestamp,
  showTimestamp = true,
  className = ''
}) => {
  const getStatusIcon = () => {
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
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Enviando...';
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'read':
        return 'Leído';
      case 'failed':
        return 'Error al enviar';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {getStatusIcon()}
      {showTimestamp && timestamp && (
        <span className="text-xs text-gray-500">
          {timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
      <span className="text-xs text-gray-500">{getStatusText()}</span>
    </div>
  );
};

// Indicador de presencia de usuario
interface UserPresenceProps {
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  isOnline,
  lastSeen,
  isTyping,
  showLastSeen = true,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const getPresenceColor = () => {
    if (isTyping) return 'bg-blue-500';
    if (isOnline) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getPresenceText = () => {
    if (isTyping) return 'Escribiendo...';
    if (isOnline) return 'En línea';
    if (lastSeen) {
      const now = new Date();
      const diffMs = now.getTime() - lastSeen.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} minutos`;
      if (diffHours < 24) return `Hace ${diffHours} horas`;
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return `Visto ${lastSeen.toLocaleDateString()}`;
    }
    return 'Desconectado';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full ${getPresenceColor()}`}>
        {isTyping && (
          <div className="w-full h-full rounded-full animate-pulse" />
        )}
      </div>
      {showLastSeen && (
        <span className="text-xs text-gray-500">
          {getPresenceText()}
        </span>
      )}
    </div>
  );
};

// Indicador de notificaciones
interface NotificationIndicatorProps {
  count: number;
  isEnabled: boolean;
  isMuted: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  className?: string;
}

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  count,
  isEnabled,
  isMuted,
  priority = 'medium',
  className = ''
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isEnabled || count === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-1">
        {isMuted ? (
          <div className="w-4 h-4 text-gray-400" />
        ) : (
          <div className="w-4 h-4 text-gray-600" />
        )}
        
        <div className={`
          min-w-[16px] h-4 px-1 rounded-full text-xs text-white font-medium
          flex items-center justify-center ${getPriorityColor()}
        `}>
          {count > 99 ? '99+' : count}
        </div>
      </div>
    </div>
  );
};

// Indicador de calidad de audio/video
interface MediaQualityProps {
  type: 'audio' | 'video';
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  isEnabled: boolean;
  isMuted?: boolean;
  className?: string;
}

export const MediaQuality: React.FC<MediaQualityProps> = ({
  type,
  quality,
  isEnabled,
  isMuted,
  className = ''
}) => {
  const getQualityColor = () => {
    switch (quality) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-yellow-500';
      case 'poor':
        return 'text-orange-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getIcon = () => {
    if (type === 'audio') {
      if (isMuted) return <div className="w-4 h-4 text-gray-400" />;
      return <div className="w-4 h-4 text-gray-600" />;
    } else {
      if (!isEnabled) return <div className="w-4 h-4 text-gray-400" />;
      return <div className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={getQualityColor()}>
        {getIcon()}
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`w-1 h-3 rounded-full ${
              quality === 'excellent' || 
              (quality === 'good' && level <= 2) ||
              (quality === 'poor' && level <= 1)
                ? getQualityColor()
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Indicador de actividad de agente
interface AgentActivityProps {
  isActive: boolean;
  responseTime: number; // en minutos
  workload: number; // número de conversaciones activas
  status: 'available' | 'busy' | 'away' | 'offline';
  className?: string;
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  isActive,
  responseTime,
  workload,
  status,
  className = ''
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-red-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Ocupado';
      case 'away':
        return 'Ausente';
      case 'offline':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  };

  const getResponseTimeText = () => {
    if (responseTime < 1) return 'Respuesta inmediata';
    if (responseTime < 60) return `${responseTime}m respuesta`;
    const hours = Math.floor(responseTime / 60);
    return `${hours}h respuesta`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      <div className="text-sm">
        <span className="font-medium text-gray-700">{getStatusText()}</span>
        {isActive && (
          <div className="text-xs text-gray-500">
            {getResponseTimeText()} • {workload} conversaciones
          </div>
        )}
      </div>
    </div>
  );
};

// Indicador de modo de vista
interface ViewModeIndicatorProps {
  mode: 'normal' | 'compact' | 'detailed';
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  className?: string;
}

export const ViewModeIndicator: React.FC<ViewModeIndicatorProps> = ({
  mode,
  unreadCount,
  isArchived,
  isPinned,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isPinned && (
        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      )}
      
      {isArchived && (
        <div className="w-2 h-2 bg-gray-500 rounded-full" />
      )}
      
      {unreadCount > 0 && (
        <div className="min-w-[16px] h-4 px-1 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        {mode === 'compact' && <div className="w-3 h-3" />}
        {mode === 'detailed' && <div className="w-3 h-3" />}
      </div>
    </div>
  );
};

// Indicador de progreso de carga
interface LoadingProgressProps {
  progress: number;
  isLoading: boolean;
  label?: string;
  className?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  progress,
  isLoading,
  label,
  className = ''
}) => {
  if (!isLoading) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-4 h-4">
        <Loader className="w-4 h-4 animate-spin text-blue-500" />
      </div>
      
      <div className="flex-1">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {label && (
          <div className="text-xs text-gray-500 mt-1">{label}</div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 font-medium">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

// Indicador de batería (para dispositivos móviles)
interface BatteryIndicatorProps {
  level: number;
  isCharging: boolean;
  showPercentage?: boolean;
  className?: string;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  level,
  isCharging,
  showPercentage = true,
  className = ''
}) => {
  const getBatteryIcon = () => {
    if (level <= 20) return <BatteryLow className="w-4 h-4 text-red-500" />;
    return <Battery className="w-4 h-4 text-gray-600" />;
  };

  const getBatteryColor = () => {
    if (isCharging) return 'text-green-500';
    if (level <= 20) return 'text-red-500';
    if (level <= 50) return 'text-yellow-500';
    return 'text-gray-600';
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={getBatteryColor()}>
        {getBatteryIcon()}
      </div>
      {showPercentage && (
        <span className="text-xs text-gray-500">
          {level}%{isCharging && ' (Cargando)'}
        </span>
      )}
    </div>
  );
};

// Componente que agrupa todos los indicadores
interface ChatStatusBarProps {
  connectionStatus: {
    isConnected: boolean;
    quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  };
  userPresence: {
    isOnline: boolean;
    lastSeen?: Date;
    isTyping?: boolean;
  };
  notifications: {
    count: number;
    isEnabled: boolean;
    isMuted: boolean;
  };
  agentActivity: {
    isActive: boolean;
    responseTime: number;
    workload: number;
    status: 'available' | 'busy' | 'away' | 'offline';
  };
  className?: string;
}

export const ChatStatusBar: React.FC<ChatStatusBarProps> = ({
  connectionStatus,
  userPresence,
  notifications,
  agentActivity,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="flex items-center space-x-4">
        <ConnectionStatus
          isConnected={connectionStatus.isConnected}
          connectionQuality={connectionStatus.quality}
        />
        
        <UserPresence
          isOnline={userPresence.isOnline}
          lastSeen={userPresence.lastSeen}
          isTyping={userPresence.isTyping}
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <NotificationIndicator
          count={notifications.count}
          isEnabled={notifications.isEnabled}
          isMuted={notifications.isMuted}
        />
        
        <AgentActivity
          isActive={agentActivity.isActive}
          responseTime={agentActivity.responseTime}
          workload={agentActivity.workload}
          status={agentActivity.status}
        />
      </div>
    </div>
  );
}; 