import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { connectionService, Connection } from '../services/connectionService';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickMessage {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

const QuickMessages: React.FC = () => {
  const { } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [quickMessages, setQuickMessages] = useState<QuickMessage[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<QuickMessage | null>(null);
  const [newQuickMessage, setNewQuickMessage] = useState({ title: '', message: '', isActive: true });
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');

  // Cargar conexiones al montar el componente
  useEffect(() => {
    loadConnections();
    loadQuickMessages();
  }, []);

  const loadConnections = async () => {
    try {
      setLoadingConnections(true);
      const response = await connectionService.getAll();
      const connectedConnections = response.data?.filter(conn => conn.status === 'CONNECTED') || [];
      setConnections(connectedConnections);
      
      if (connectedConnections.length > 0) {
        setSelectedConnection(connectedConnections[0].id);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error('Error al cargar las conexiones');
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadQuickMessages = () => {
    // Simulación de mensajes rápidos guardados localmente
    const savedMessages = localStorage.getItem('quickMessages');
    if (savedMessages) {
      setQuickMessages(JSON.parse(savedMessages));
    } else {
      const defaultMessages: QuickMessage[] = [
        {
          id: '1',
          title: 'Saludo inicial',
          message: '¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Información de horarios',
          message: 'Nuestros horarios de atención son de Lunes a Viernes de 9:00 AM a 6:00 PM.',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Despedida',
          message: 'Gracias por contactarnos. ¡Que tengas un excelente día!',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      setQuickMessages(defaultMessages);
      localStorage.setItem('quickMessages', JSON.stringify(defaultMessages));
    }
  };

  const saveQuickMessages = (messages: QuickMessage[]) => {
    localStorage.setItem('quickMessages', JSON.stringify(messages));
    setQuickMessages(messages);
  };

  const handleSendMessage = async () => {
    if (!selectedConnection || !phoneNumber || !message) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Validar número de teléfono
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Por favor ingresa un número de teléfono válido');
      return;
    }

    setIsLoading(true);
    try {
      // Llamada real al backend para enviar mensaje
      const result = await connectionService.sendMessage(selectedConnection, phoneNumber, message);
      
      console.log('Mensaje enviado:', result);
      toast.success(`Mensaje enviado exitosamente a ${phoneNumber}`);
      setMessage('');
      setPhoneNumber('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Error al enviar el mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseQuickMessage = (quickMessage: QuickMessage) => {
    setMessage(quickMessage.message);
    toast.success(`Mensaje "${quickMessage.title}" cargado`);
  };

  const handleCreateQuickMessage = () => {
    if (!newQuickMessage.title || !newQuickMessage.message) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const newMessage: QuickMessage = {
      id: Date.now().toString(),
      title: newQuickMessage.title,
      message: newQuickMessage.message,
      isActive: newQuickMessage.isActive,
      createdAt: new Date().toISOString()
    };

    const updatedMessages = [...quickMessages, newMessage];
    saveQuickMessages(updatedMessages);
    setNewQuickMessage({ title: '', message: '', isActive: true });
    setShowCreateModal(false);
    toast.success('Mensaje rápido creado exitosamente');
  };

  const handleEditQuickMessage = (message: QuickMessage) => {
    setEditingMessage(message);
    setNewQuickMessage({
      title: message.title,
      message: message.message,
      isActive: message.isActive
    });
    setShowCreateModal(true);
  };

  const handleUpdateQuickMessage = () => {
    if (!editingMessage || !newQuickMessage.title || !newQuickMessage.message) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const updatedMessages = quickMessages.map(msg =>
      msg.id === editingMessage.id
        ? { ...msg, title: newQuickMessage.title, message: newQuickMessage.message, isActive: newQuickMessage.isActive }
        : msg
    );

    saveQuickMessages(updatedMessages);
    setEditingMessage(null);
    setNewQuickMessage({ title: '', message: '', isActive: true });
    setShowCreateModal(false);
    toast.success('Mensaje rápido actualizado exitosamente');
  };

  const handleDeleteQuickMessage = (messageId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este mensaje rápido?')) {
      const updatedMessages = quickMessages.filter(msg => msg.id !== messageId);
      saveQuickMessages(updatedMessages);
      toast.success('Mensaje rápido eliminado');
    }
  };

  const toggleMessageActive = (messageId: string) => {
    const updatedMessages = quickMessages.map(msg =>
      msg.id === messageId ? { ...msg, isActive: !msg.isActive } : msg
    );
    saveQuickMessages(updatedMessages);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CONNECTING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const handlePreviewMessage = (message: string) => {
    setPreviewMessage(message);
    setShowMessagePreview(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Mensajes Rápidos
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Envía mensajes por WhatsApp usando respuestas predefinidas
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Mensaje</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de envío */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Enviar Mensaje
                </h2>
              </div>

              <div className="space-y-4">
                {/* Selección de conexión */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Conexión de WhatsApp
                  </label>
                  {loadingConnections ? (
                    <div className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Cargando conexiones...</span>
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="flex items-center space-x-2 p-3 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">
                        No hay conexiones de WhatsApp disponibles
                      </span>
                    </div>
                  ) : (
                    <select
                      value={selectedConnection}
                      onChange={(e) => setSelectedConnection(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {connections.map((connection) => (
                        <option key={connection.id} value={connection.id}>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(connection.status)}
                            <span>{connection.name}</span>
                          </div>
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Número de teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de teléfono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ej: +1234567890"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Escribe tu mensaje aquí..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Caracteres: {message.length}
                  </div>
                </div>

                {/* Botón de envío */}
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !selectedConnection || !phoneNumber || !message}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Mensaje</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Panel de mensajes rápidos */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Mensajes Rápidos
                </h2>
              </div>

              <div className="space-y-3">
                {quickMessages.filter(msg => msg.isActive).map((quickMessage) => (
                  <div
                    key={quickMessage.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          {quickMessage.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {quickMessage.message}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePreviewMessage(quickMessage.message)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Ver mensaje completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditQuickMessage(quickMessage)}
                          className="text-gray-400 hover:text-yellow-500 transition-colors"
                          title="Editar mensaje"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuickMessage(quickMessage.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar mensaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => handleUseQuickMessage(quickMessage)}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
                      >
                        Usar mensaje
                      </button>
                      <button
                        onClick={() => toggleMessageActive(quickMessage.id)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {quickMessage.isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {quickMessages.filter(msg => msg.isActive).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay mensajes rápidos disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar mensaje rápido */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingMessage ? 'Editar Mensaje Rápido' : 'Nuevo Mensaje Rápido'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newQuickMessage.title}
                  onChange={(e) => setNewQuickMessage({ ...newQuickMessage, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Saludo inicial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={newQuickMessage.message}
                  onChange={(e) => setNewQuickMessage({ ...newQuickMessage, message: e.target.value })}
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Escribe el mensaje aquí..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newQuickMessage.isActive}
                  onChange={(e) => setNewQuickMessage({ ...newQuickMessage, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Mensaje activo
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingMessage(null);
                  setNewQuickMessage({ title: '', message: '', isActive: true });
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingMessage ? handleUpdateQuickMessage : handleCreateQuickMessage}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingMessage ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para vista previa de mensaje */}
      {showMessagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Vista Previa del Mensaje
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {previewMessage}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowMessagePreview(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickMessages; 