import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Archive, 
  BarChart3, 
  MessageSquare, 
  Clock, 
  Users,
  FileText,
  Image,
  Video,
  Music,
  Paperclip,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from 'recharts';

import conversationHistoryService, {
  ConversationHistoryFilters,
  ConversationHistoryStats,
  ExportOptions,
  ConversationHistoryResponse
} from '../services/conversationHistoryService';

interface ConversationHistoryDashboardProps {
  className?: string;
}

const ConversationHistoryDashboard: React.FC<ConversationHistoryDashboardProps> = ({ className }) => {
  // Estado del dashboard
  const [activeTab, setActiveTab] = useState<'history' | 'statistics' | 'search'>('history');
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Estado del historial
  const [historyData, setHistoryData] = useState<ConversationHistoryResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  
  // Estado de filtros
  const [filters, setFilters] = useState<ConversationHistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado de estadísticas
  const [stats, setStats] = useState<ConversationHistoryStats | null>(null);
  
  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  
  // Estado de exportación
  const [exportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMedia: false,
    includeMetadata: false,
    includeStats: false,
    maxRecords: 10000
  });

  // Cargar historial
  const loadHistory = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await conversationHistoryService.getConversationHistory(
        filters,
        page,
        pageSize
      );
      setHistoryData(data);
      setCurrentPage(page);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await conversationHistoryService.getHistoryStatistics(filters);
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Buscar mensajes
  const searchMessages = async () => {
    if (!searchTerm.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      const data = await conversationHistoryService.searchMessages(
        searchTerm,
        filters,
        1,
        pageSize
      );
      setSearchResults(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al buscar mensajes');
    } finally {
      setLoading(false);
    }
  };

  // Exportar historial
  const exportHistory = async () => {
    try {
      setExportLoading(true);
      const result = await conversationHistoryService.exportHistory(filters, exportOptions);
      
      // Descargar archivo
      const blob = await conversationHistoryService.downloadExport(result.exportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_history_${Date.now()}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Historial exportado: ${result.recordCount} registros`);
    } catch (error: any) {
      toast.error(error.message || 'Error al exportar el historial');
    } finally {
      setExportLoading(false);
    }
  };

  // Archivar conversación
  const archiveConversation = async (conversationId: string) => {
    try {
      await conversationHistoryService.archiveConversation(conversationId);
      toast.success('Conversación archivada');
      loadHistory(currentPage);
    } catch (error: any) {
      toast.error(error.message || 'Error al archivar conversación');
    }
  };

  // Aplicar filtros predefinidos
  const applyPresetFilter = (preset: string) => {
    const presets = conversationHistoryService.getFilterPresets();
    setFilters(presets[preset]);
    setShowFilters(false);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  // Efectos
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    } else if (activeTab === 'statistics') {
      loadStatistics();
    }
  }, [activeTab, filters]);

  // Colores para gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Iconos para tipos de mensaje
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageSquare className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      default: return <Paperclip className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Historial de Conversaciones
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            <button
              onClick={exportHistory}
              disabled={exportLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exportLoading ? 'Exportando...' : 'Exportar'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Búsqueda Avanzada
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="border-b border-gray-200 p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Filtros de fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha desde
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filtros de contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de mensaje
              </label>
              <select
                value={filters.messageType || ''}
                onChange={(e) => setFilters({ ...filters, messageType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="text">Texto</option>
                <option value="image">Imagen</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">Documento</option>
                <option value="location">Ubicación</option>
              </select>
            </div>

            {/* Filtros de estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="sent">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="read">Leído</option>
                <option value="failed">Fallido</option>
              </select>
            </div>

            {/* Filtros adicionales */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasMedia || false}
                  onChange={(e) => setFilters({ ...filters, hasMedia: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Con media</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.archived || false}
                  onChange={(e) => setFilters({ ...filters, archived: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Archivadas</span>
              </label>
            </div>
          </div>

          {/* Filtros predefinidos */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => applyPresetFilter('today')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
            >
              Hoy
            </button>
            <button
              onClick={() => applyPresetFilter('lastWeek')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
            >
              Última semana
            </button>
            <button
              onClick={() => applyPresetFilter('lastMonth')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
            >
              Último mes
            </button>
            <button
              onClick={() => applyPresetFilter('withMedia')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200"
            >
              Con media
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="p-6">
        {/* Tab: Historial */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : historyData ? (
              <div className="space-y-4">
                {/* Información de paginación */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Mostrando {historyData.conversations.length} de {historyData.pagination.total} conversaciones
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => loadHistory(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPage} de {historyData.pagination.pages}
                    </span>
                    <button
                      onClick={() => loadHistory(currentPage + 1)}
                      disabled={currentPage === historyData.pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>

                {/* Lista de conversaciones */}
                <div className="space-y-4">
                  {historyData.conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {conversation.contact.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {conversation.contact.number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {conversation._count.messages} mensajes
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(conversation.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              {conversation.connection.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => archiveConversation(conversation.id)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Últimos mensajes */}
                      {conversation.messages.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Últimos mensajes
                          </h4>
                          <div className="space-y-2">
                            {conversation.messages.slice(0, 3).map((message) => (
                              <div
                                key={message.id}
                                className={`flex items-start space-x-2 ${
                                  message.fromMe ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <div
                                  className={`max-w-xs px-3 py-2 rounded-lg ${
                                    message.fromMe
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    {getMessageTypeIcon(message.mediaType || 'text')}
                                    <span className="text-sm">
                                      {message.content.substring(0, 50)}
                                      {message.content.length > 50 && '...'}
                                    </span>
                                  </div>
                                  <p className="text-xs opacity-75 mt-1">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay conversaciones para mostrar</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Estadísticas */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Estadísticas generales */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Estadísticas Generales
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.totalConversations.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Conversaciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.totalMessages.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Mensajes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.averageMessagesPerConversation.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Promedio por conversación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.responseTimeStats.averageResponseTime.toFixed(1)}m
                      </div>
                      <div className="text-sm text-gray-600">Tiempo de respuesta</div>
                    </div>
                  </div>
                </div>

                {/* Gráfico de mensajes por tipo */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Mensajes por Tipo
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.messagesByType).map(([type, count]) => ({
                          name: type,
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(stats.messagesByType).map(([, index]) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico de actividad diaria */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Actividad Diaria (Últimos 30 días)
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stats.dailyMessageCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top contactos */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top Contactos
                  </h3>
                  <div className="space-y-3">
                    {stats.topContacts.slice(0, 5).map((contact, index) => (
                      <div key={contact.contactId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{contact.name}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {contact.messageCount} mensajes
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distribución tiempo de respuesta */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tiempo de Respuesta
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={Object.entries(stats.responseTimeStats.responseTimeDistribution).map(([range, count]) => ({
                        range: range.replace('_', ' '),
                        count
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay estadísticas disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Búsqueda */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar en mensajes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchMessages();
                      }
                    }}
                  />
                </div>
              </div>
              <button
                onClick={searchMessages}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searchResults && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {searchResults.messages.length} resultados encontrados
                  </p>
                </div>

                <div className="space-y-3">
                  {searchResults.messages.map((message: any) => (
                    <div
                      key={message.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              {getMessageTypeIcon(message.mediaType || 'text')}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {message.conversation.contact.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {message.conversation.contact.number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-gray-900">
                              {message.content}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistoryDashboard; 