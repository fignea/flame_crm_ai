import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Settings, 
  Check, 
  AlertCircle, 
  MessageSquare, 
  Ticket, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  Clock,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import notificationService from '../services/notificationService';

interface Notification {
  id: string;
  type: 'message' | 'ticket' | 'assignment' | 'system' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  entityId?: string;
  entityType?: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  // Sonidos para diferentes tipos de notificaciones
  const notificationSounds = {
    message: '/sounds/message.mp3',
    ticket: '/sounds/ticket.mp3',
    assignment: '/sounds/assignment.mp3',
    system: '/sounds/system.mp3',
    warning: '/sounds/warning.mp3',
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3'
  };

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Cargar preferencias
  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setSoundEnabled(prefs.soundEnabled);
    } catch (error: any) {
      console.error('Error loading preferences:', error);
    }
  };

  // Reproducir sonido
  const playNotificationSound = (type: string) => {
    if (!soundEnabled) return;
    
    try {
      const soundFile = notificationSounds[type as keyof typeof notificationSounds] || notificationSounds.system;
      if (audioRef.current) {
        audioRef.current.src = soundFile;
        audioRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Mostrar notificación de escritorio
  const showDesktopNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      desktopNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        desktopNotification.close();
      };

      setTimeout(() => {
        desktopNotification.close();
      }, 5000);
    }
  };

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar como leída');
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar todas como leídas');
    }
  };

  // Solicitar permiso para notificaciones de escritorio
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Permisos de notificación concedidos');
      }
    }
  };

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  // Obtener icono por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'ticket':
        return <Ticket className="w-4 h-4" />;
      case 'assignment':
        return <Users className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Obtener color por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'text-blue-600 bg-blue-100';
      case 'ticket':
        return 'text-green-600 bg-green-100';
      case 'assignment':
        return 'text-purple-600 bg-purple-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Obtener color por prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  // Efectos
  useEffect(() => {
    loadNotifications();
    loadPreferences();
    requestNotificationPermission();
  }, []);

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Reproducir sonido
      playNotificationSound(notification.type);
      
      // Mostrar notificación de escritorio
      showDesktopNotification(notification);
    };

    const handleNotificationRead = ({ notificationId }: { notificationId: string }) => {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleAllNotificationsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    };

    socket.on('notification', handleNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('all_notifications_read', handleAllNotificationsRead);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('all_notifications_read', handleAllNotificationsRead);
    };
  }, [socket, soundEnabled]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      {/* Audio element para sonidos */}
      <audio ref={audioRef} preload="auto" />
      
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center space-x-2 mt-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">Todas</option>
                <option value="unread">No leídas</option>
                <option value="read">Leídas</option>
              </select>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Cargando notificaciones...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {unreadCount > 0 ? `${unreadCount} no leídas` : 'Todo al día'}
              </span>
              <button
                onClick={loadNotifications}
                className="text-blue-600 hover:text-blue-800"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de configuración */}
      {showSettings && (
        <div className="absolute right-0 mt-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Configuración de Notificaciones
            </h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Sonido</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Notificaciones de escritorio</span>
              <button
                onClick={requestNotificationPermission}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Activar
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Personaliza tus preferencias de notificación en la configuración de tu perfil.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 