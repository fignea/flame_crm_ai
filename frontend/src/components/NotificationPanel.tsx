import React, { useState, useEffect } from 'react';
import { X, Bell, Settings, Trash2, Check, CheckCheck, MessageSquare, Users, Ticket, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import notificationService from '../services/notificationService';

interface Notification {
  id: string;
  type: 'message' | 'ticket' | 'assignment' | 'system' | 'warning' | 'success' | 'error' | 'transfer';
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

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  types: {
    message: boolean;
    ticket: boolean;
    assignment: boolean;
    system: boolean;
    warning: boolean;
    success: boolean;
    error: boolean;
  };
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    desktop: true,
    types: {
      message: true,
      ticket: true,
      assignment: true,
      system: true,
      warning: true,
      success: true,
      error: true
    }
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    // TODO: Implementar markAllAsRead en notificationService
    console.log('Mark all as read');
  };

  const handleClearAll = () => {
    // TODO: Implementar clearAll en notificationService
    console.log('Clear all');
  };

  const handleSettingsChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // TODO: Implementar updateSettings en notificationService
    console.log('Update settings:', newSettings);
  };

  const handleTypeToggle = (type: keyof NotificationSettings['types']) => {
    const newTypes = { ...settings.types, [type]: !settings.types[type] };
    const newSettings = { ...settings, types: newTypes };
    setSettings(newSettings);
    // TODO: Implementar updateSettings en notificationService
    console.log('Update settings:', newSettings);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'assignment':
      case 'transfer':
        return <Users className="w-4 h-4" />;
      case 'ticket':
        return <Ticket className="w-4 h-4" />;
      case 'system':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'text-blue-600 bg-blue-100';
      case 'assignment':
        return 'text-green-600 bg-green-100';
      case 'transfer':
        return 'text-purple-600 bg-purple-100';
      case 'ticket':
        return 'text-orange-600 bg-orange-100';
      case 'system':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notificaciones
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Configuración"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Configuración de Notificaciones</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificaciones habilitadas
                </label>
                <button
                  onClick={() => handleSettingsChange('enabled', !settings.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sonido
                </label>
                <button
                  onClick={() => handleSettingsChange('sound', !settings.sound)}
                  className={`p-2 rounded-lg transition-colors ${
                    settings.sound
                      ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
                      : 'text-gray-400 bg-gray-100 dark:bg-gray-600'
                  }`}
                >
                  {settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificaciones de escritorio
                </label>
                <button
                  onClick={() => handleSettingsChange('desktop', !settings.desktop)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.desktop ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.desktop ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipos de notificaciones
                </h4>
                <div className="space-y-2">
                  {Object.entries(settings.types).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                      <label className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {type === 'message' && 'Mensajes'}
                        {type === 'assignment' && 'Asignaciones'}
                        {type === 'transfer' && 'Transferencias'}
                        {type === 'ticket' && 'Tickets'}
                        {type === 'system' && 'Sistema'}
                      </label>
                      <button
                        onClick={() => handleTypeToggle(type as keyof NotificationSettings['types'])}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar todo
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Las notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    notification.read
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel; 