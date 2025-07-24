import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Calendar, Search, RotateCcw, Save, Star, Users, MessageSquare, Hash, SortAsc, SortDesc } from 'lucide-react';
import { toast } from 'react-hot-toast';
import conversationService, { type ConversationFilters, FilterOptions } from '../services/conversationService';

interface ConversationFiltersProps {
  onFiltersChange: (filters: ConversationFilters) => void;
  initialFilters?: ConversationFilters;
  stats?: {
    unreadCount: number;
    assignedCount: number;
    unassignedCount: number;
    withTicketCount: number;
  };
}

interface SavedFilter {
  id: string;
  name: string;
  filters: ConversationFilters;
  isDefault: boolean;
  createdAt: string;
}

const ConversationFilters: React.FC<ConversationFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  stats
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [customDateRange, setCustomDateRange] = useState({
    from: '',
    to: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Cargar opciones de filtros al montar el componente
  useEffect(() => {
    loadFilterOptions();
    loadSavedFilters();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const options = await conversationService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
      toast.error('Error cargando opciones de filtros');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('conversationFilters');
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const saveFilter = () => {
    if (!saveFilterName.trim()) {
      toast.error('Por favor ingresa un nombre para el filtro');
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveFilterName,
      filters,
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    localStorage.setItem('conversationFilters', JSON.stringify(updatedFilters));
    
    setShowSaveModal(false);
    setSaveFilterName('');
    toast.success('Filtro guardado exitosamente');
  };

  const applySavedFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    toast.success(`Filtro "${savedFilter.name}" aplicado`);
  };

  const deleteSavedFilter = (id: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updatedFilters);
    localStorage.setItem('conversationFilters', JSON.stringify(updatedFilters));
    toast.success('Filtro eliminado');
  };

  const applyQuickFilter = (type: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    let newFilters: ConversationFilters = { ...filters };

    switch (type) {
      case 'unread':
        newFilters = { ...newFilters, status: 'unread' };
        break;
      case 'assigned':
        newFilters = { ...newFilters, assignedTo: 'assigned' };
        break;
      case 'unassigned':
        newFilters = { ...newFilters, assignedTo: 'unassigned' };
        break;
      case 'with-ticket':
        newFilters = { ...newFilters, hasTicket: true };
        break;
      case 'today':
        newFilters = { 
          ...newFilters, 
          dateFrom: today.toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0]
        };
        break;
      case 'yesterday':
        newFilters = { 
          ...newFilters, 
          dateFrom: yesterday.toISOString().split('T')[0],
          dateTo: yesterday.toISOString().split('T')[0]
        };
        break;
      case 'thisWeek':
        newFilters = { 
          ...newFilters, 
          dateFrom: thisWeekStart.toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0]
        };
        break;
      case 'thisMonth':
        newFilters = { 
          ...newFilters, 
          dateFrom: thisMonthStart.toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0]
        };
        break;
      case 'lastMonth':
        newFilters = { 
          ...newFilters, 
          dateFrom: lastMonthStart.toISOString().split('T')[0],
          dateTo: lastMonthEnd.toISOString().split('T')[0]
        };
        break;
      default:
        break;
    }

    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
    setCustomDateRange({ from: '', to: '' });
    toast.success('Filtros limpiados');
  };

  const updateFilter = (key: keyof ConversationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setCustomDateRange({ from, to });
    setFilters(prev => ({
      ...prev,
      dateFrom: from,
      dateTo: to
    }));
  };

  const getActiveFiltersCount = () => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return false;
      return value !== undefined && value !== null && value !== '' && value !== 'all';
    });
    return activeFilters.length;
  };

  const formatDateRange = (dateFrom?: string, dateTo?: string) => {
    if (!dateFrom && !dateTo) return '';
    if (dateFrom === dateTo && dateFrom) return new Date(dateFrom).toLocaleDateString('es-ES');
    return `${dateFrom ? new Date(dateFrom).toLocaleDateString('es-ES') : ''} - ${dateTo ? new Date(dateTo).toLocaleDateString('es-ES') : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Header con filtros rápidos */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Filtros {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Guardar
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isExpanded ? 'Menos' : 'Más'}
            </button>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2 mb-4">
          {stats && (
            <>
              <button
                onClick={() => applyQuickFilter('unread')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  filters.status === 'unread'
                    ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" />
                No leídos ({stats.unreadCount})
              </button>
              <button
                onClick={() => applyQuickFilter('unassigned')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  filters.assignedTo === 'unassigned'
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Users className="w-3 h-3 inline mr-1" />
                Sin asignar ({stats.unassignedCount})
              </button>
              <button
                onClick={() => applyQuickFilter('with-ticket')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  filters.hasTicket === true
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Hash className="w-3 h-3 inline mr-1" />
                Con ticket ({stats.withTicketCount})
              </button>
            </>
          )}
          
          {/* Filtros de fecha rápidos */}
          <button
            onClick={() => applyQuickFilter('today')}
            className="px-3 py-1 text-xs rounded-full border bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Calendar className="w-3 h-3 inline mr-1" />
            Hoy
          </button>
          <button
            onClick={() => applyQuickFilter('thisWeek')}
            className="px-3 py-1 text-xs rounded-full border bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Esta semana
          </button>
          <button
            onClick={() => applyQuickFilter('thisMonth')}
            className="px-3 py-1 text-xs rounded-full border bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Este mes
          </button>
        </div>

        {/* Filtros guardados */}
        {savedFilters.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Filtros guardados
            </h4>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((savedFilter) => (
                <div key={savedFilter.id} className="flex items-center gap-1">
                  <button
                    onClick={() => applySavedFilter(savedFilter)}
                    className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    {savedFilter.name}
                  </button>
                  <button
                    onClick={() => deleteSavedFilter(savedFilter.id)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filtros avanzados (expandibles) */}
      {isExpanded && filterOptions && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
            
            {/* Filtro de búsqueda */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro de estado */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {filterOptions.statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de conexión */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Conexión
              </label>
              <select
                value={filters.connectionId || 'all'}
                onChange={(e) => updateFilter('connectionId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas las conexiones</option>
                {filterOptions.connections.map(connection => (
                  <option key={connection.id} value={connection.id}>
                    {connection.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de asignación */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asignado a
              </label>
              <select
                value={filters.assignedTo || 'all'}
                onChange={(e) => updateFilter('assignedTo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {filterOptions.assignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de rango de fechas */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rango de fechas
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Seleccionar fechas..."
                  value={formatDateRange(filters.dateFrom, filters.dateTo)}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                />
                {showDatePicker && (
                  <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-[280px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={customDateRange.from}
                          onChange={(e) => handleDateRangeChange(e.target.value, customDateRange.to)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={customDateRange.to}
                          onChange={(e) => handleDateRangeChange(customDateRange.from, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setCustomDateRange({ from: '', to: '' });
                          handleDateRangeChange('', '');
                        }}
                        className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        Limpiar
                      </button>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filtro de número de mensajes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de mensajes
              </label>
              <select
                value={filters.messageCount || 'all'}
                onChange={(e) => updateFilter('messageCount', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {filterOptions.messageCountOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de tiempo de respuesta */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiempo de respuesta
              </label>
              <select
                value={filters.responseTime || 'all'}
                onChange={(e) => updateFilter('responseTime', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {filterOptions.responseTimeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de tipo de mensaje */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de mensaje
              </label>
              <select
                value={filters.messageType || 'all'}
                onChange={(e) => updateFilter('messageType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los tipos</option>
                <option value="text">Texto</option>
                {filterOptions.messageTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de ordenamiento */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordenar por
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy || 'updatedAt'}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {filterOptions.sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  title={filters.sortOrder === 'desc' ? 'Descendente' : 'Ascendente'}
                >
                  {filters.sortOrder === 'desc' ? 
                    <SortDesc className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : 
                    <SortAsc className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  }
                </button>
              </div>
            </div>

            {/* Filtro de ticket */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ticket
              </label>
              <select
                value={filters.hasTicket === undefined ? 'all' : filters.hasTicket.toString()}
                onChange={(e) => updateFilter('hasTicket', e.target.value === 'all' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="true">Con ticket</option>
                <option value="false">Sin ticket</option>
              </select>
            </div>

            {/* Filtro de etiquetas */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Etiquetas
              </label>
              <select
                value={filters.tags || ''}
                onChange={(e) => updateFilter('tags', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las etiquetas</option>
                {filterOptions.commonTags.map(tag => (
                  <option key={`${tag.attribute}-${tag.value}`} value={tag.value}>
                    {tag.label} ({tag.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Modal para guardar filtro */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Guardar Filtro
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del filtro
                </label>
                <input
                  type="text"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  placeholder="Ej: Conversaciones urgentes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveFilter}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationFilters; 