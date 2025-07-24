import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Connection as ConnectionType, connectionService } from '../services/connectionService';
import { 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Plus, 
  Trash2, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';

interface ConnectionFormData {
  name: string;
  type: 'whatsapp_web' | 'whatsapp_business' | 'instagram' | 'facebook';
  isDefault?: boolean;
}

const Connections: React.FC = () => {
  const { } = useAuth();
  const [connections, setConnections] = useState<ConnectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionType | null>(null);
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    type: 'whatsapp_web'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);

  // Cargar conexiones al montar el componente
  useEffect(() => {
    loadConnections();
  }, []);

  // Limpiar intervalo cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [statusInterval]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await connectionService.getAll();
      setConnections(response.data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error('Error al cargar las conexiones');
    } finally {
      setLoading(false);
    }
  };

  const clearQRState = () => {
    setQrCode(null);
    setQrLoading(false);
    setQrError(null);
    if (statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
  };

  const closeQRModal = () => {
    clearQRState();
    setShowQRModal(false);
    setSelectedConnection(null);
  };

  const connectionTypes = [
    {
      type: 'whatsapp_web',
      name: 'WhatsApp Web',
      description: 'Conecta tu WhatsApp personal usando código QR',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'bg-green-500',
      available: true
    },
    {
      type: 'whatsapp_business',
      name: 'WhatsApp Business',
      description: 'Conecta tu cuenta de WhatsApp Business API',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'bg-blue-500',
      available: false
    },
    {
      type: 'instagram',
      name: 'Instagram',
      description: 'Conecta tu cuenta de Instagram Business',
      icon: <Instagram className="w-6 h-6" />,
      color: 'bg-pink-500',
      available: false
    },
    {
      type: 'facebook',
      name: 'Facebook',
      description: 'Conecta tu página de Facebook',
      icon: <Facebook className="w-6 h-6" />,
      color: 'bg-blue-600',
      available: false
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'CONNECTING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'Conectado';
      case 'CONNECTING':
        return 'Conectando...';
      case 'ERROR':
        return 'Error';
      default:
        return 'Desconectado';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'text-green-600 bg-green-100';
      case 'CONNECTING':
        return 'text-yellow-600 bg-yellow-100';
      case 'ERROR':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCreateConnection = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsLoading(true);
    try {
      const newConnection = await connectionService.create({
        name: formData.name,
        type: formData.type,
        isDefault: formData.isDefault || false
      });

      setConnections(prev => [...prev, newConnection]);
      setShowCreateModal(false);
      setFormData({ name: '', type: 'whatsapp_web' });
      toast.success('Conexión creada exitosamente');
    } catch (error) {
      toast.error('Error al crear la conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConnection = async (connection: ConnectionType) => {
    if (connection.type === 'whatsapp_web') {
      // Limpiar estado anterior si existe
      clearQRState();
      
      setSelectedConnection(connection);
      setShowQRModal(true);
      setQrLoading(true);
      
      try {
        const res = await connectionService.startSession(connection.id);
        setQrCode(res.qrcode);
        
        // Verificar el estado de la conexión periódicamente
        const checkStatus = async () => {
          try {
            const statusRes = await connectionService.getStatus(connection.id);
            if (statusRes.status === 'CONNECTED') {
              toast.success('¡WhatsApp conectado exitosamente!');
              closeQRModal();
              setConnections(prev => 
                prev.map(c => 
                  c.id === connection.id 
                    ? { ...c, status: 'CONNECTED' as const }
                    : c
                )
              );
              return; // Detener el polling
            } else if (statusRes.status === 'ERROR') {
              setQrError('Error en la conexión. Intenta nuevamente.');
              clearQRState();
            }
          } catch (error) {
            console.error('Error checking status:', error);
          }
        };
        
        // Verificar cada 3 segundos
        const interval = setInterval(checkStatus, 3000);
        setStatusInterval(interval);
        
        // Limpiar después de2tos (tiempo máximo de espera)
        setTimeout(() => {
          if (interval) {
            clearInterval(interval);
            setStatusInterval(null);
          }
        }, 120000) as any;
        
      } catch (error: any) {
        setQrError('No se pudo obtener el código QR.');
      } finally {
        setQrLoading(false);
      }
    } else {
      toast('Esta funcionalidad estará disponible pronto');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta conexión?')) {
      try {
        await connectionService.delete(connectionId);
        setConnections(prev => prev.filter(c => c.id !== connectionId));
        toast.success('Conexión eliminada');
      } catch (error) {
        toast.error('Error al eliminar la conexión');
      }
    }
  };

  const handleSetDefault = async (connectionId: string) => {
    try {
      await connectionService.update(connectionId, { isDefault: true });
      setConnections(prev => 
        prev.map(c => ({
          ...c,
          isDefault: c.id === connectionId
        }))
      );
      toast.success('Conexión predeterminada actualizada');
    } catch (error) {
      toast.error('Error al actualizar la conexión predeterminada');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Conexiones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tus conexiones de WhatsApp, Instagram y Facebook
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Conexiones</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{connections.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Conectadas</div>
          <div className="text-2xl font-bold text-green-600">
            {connections.filter(c => c.status === 'CONNECTED').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Desconectadas</div>
          <div className="text-2xl font-bold text-gray-600">
            {connections.filter(c => c.status === 'DISCONNECTED').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Con Error</div>
          <div className="text-2xl font-bold text-red-600">
            {connections.filter(c => c.status === 'ERROR').length}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Conexión
          </button>
        </div>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((connection) => {
          const connectionType = connectionTypes.find(t => t.type === connection.type);
          
          return (
            <div key={connection.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${connectionType?.color}`}>
                    {connectionType?.icon}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {connection.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {connectionType?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connection.status)}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(connection.status)}`}>
                    {getStatusText(connection.status)}
                  </span>
                </div>
              </div>

              {/* Status Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                  <span className={`font-medium ${getStatusColor(connection.status)}`}>
                    {getStatusText(connection.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Predeterminada:</span>
                  <span className={`font-medium ${connection.isDefault ? 'text-green-600' : 'text-gray-400'}`}>
                    {connection.isDefault ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {connection.status === 'DISCONNECTED' && (
                  <button
                    onClick={() => handleStartConnection(connection)}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Conectar
                  </button>
                )}
                {connection.status === 'CONNECTING' && (
                  <button
                    onClick={() => handleStartConnection(connection)}
                    className="flex-1 px-3 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Reconectar
                  </button>
                )}
                {connection.status === 'CONNECTED' && (
                  <button
                    onClick={() => toast('Funcionalidad en desarrollo')}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Configurar
                  </button>
                )}
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Default Button */}
              {!connection.isDefault && (
                <button
                  onClick={() => handleSetDefault(connection.id)}
                  className="w-full mt-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Establecer como Predeterminada
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Connection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Nueva Conexión
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Conexión
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: WhatsApp Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Conexión
                </label>
                <div className="space-y-2">
                  {connectionTypes.map((type) => (
                    <div
                      key={type.type}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        formData.type === type.type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      } ${!type.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => type.available && setFormData({ ...formData, type: type.type as 'whatsapp_web' | 'whatsapp_business' | 'instagram' | 'facebook' })}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${type.color}`}>
                          {type.icon}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 dark:text-white">{type.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
                        </div>
                        {!type.available && (
                          <span className="ml-auto text-xs text-gray-400">Próximamente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                  Establecer como conexión predeterminada
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateConnection}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Crear Conexión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Conectar {selectedConnection.name}
            </h2>
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg mb-4">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  <MessageCircle className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-sm">
                    Escanea el código QR con tu WhatsApp para conectar
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                    {qrLoading ? (
                      <span className="text-gray-500">Generando QR...</span>
                    ) : qrError ? (
                      <span className="text-red-500">{qrError}</span>
                    ) : qrCode ? (
                      <QRCode value={qrCode} size={192} />
                    ) : (
                      <span className="text-gray-500">QR no disponible</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p>1. Abre WhatsApp en tu teléfono</p>
                <p>2. Ve a Configuración → Dispositivos Vinculados</p>
                <p>3. Toca "Vincular un Dispositivo"</p>
                <p>4. Escanea el código QR</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={closeQRModal}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              {qrError && (
                <button
                  onClick={() => handleStartConnection(selectedConnection)}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Reintentar
                </button>
              )}
              {!qrError && (
              <button
                onClick={() => {
                    closeQRModal();
                  toast.success('Conexión establecida');
                  setConnections(prev =>
                    prev.map(c =>
                      c.id === selectedConnection.id
                        ? { ...c, status: 'CONNECTED' as const }
                        : c
                    )
                  );
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={qrLoading || !qrCode}
              >
                Ya Escaneé el Código
              </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections; 