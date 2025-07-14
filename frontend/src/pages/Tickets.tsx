import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ticketService } from '../services/ticketService';
import {
  List,
  Grid3X3,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Pause,
} from 'lucide-react';
import { Ticket } from '../types/api';

const Tickets: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await ticketService.getAll();
        setTickets(response.data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);


  const columns = {
    pending: {
      title: 'Pendientes',
      color: 'bg-yellow-100 border-yellow-300',
      icon: <Clock className="text-yellow-600" size={20} />
    },
    open: {
      title: 'Abiertos',
      color: 'bg-blue-100 border-blue-300',
      icon: <AlertCircle className="text-blue-600" size={20} />
    },
    waiting: {
      title: 'En Espera',
      color: 'bg-orange-100 border-orange-300',
      icon: <Pause className="text-orange-600" size={20} />
    },
    closed: {
      title: 'Cerrados',
      color: 'bg-green-100 border-green-300',
      icon: <CheckCircle className="text-green-600" size={20} />
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Normal';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Mismo column, reordenar
      const columnTickets = tickets.filter(ticket => ticket.status === source.droppableId);
      const [removed] = columnTickets.splice(source.index, 1);
      columnTickets.splice(destination.index, 0, removed);
      
      const newTickets = tickets.map(ticket => {
        if (ticket.status === source.droppableId) {
          return columnTickets.find(t => t.id === ticket.id) || ticket;
        }
        return ticket;
      });
      
      setTickets(newTickets);
    } else {
      // Diferente column, cambiar status
      const columnTickets = tickets.filter(ticket => ticket.status === source.droppableId);
      const [moved] = columnTickets.splice(source.index, 1);
      moved.status = destination.droppableId as any;
      
      const newTickets = tickets.map(ticket => 
        ticket.id === moved.id ? moved : ticket
      );
      
      setTickets(newTickets);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    (ticket.lastMessage && ticket.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ticket.contact.name && ticket.contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ticket.tags && ticket.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cargando tickets...
          </h1>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            No autorizado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Por favor inicia sesión para continuar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona y organiza tus tickets de soporte
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Nuevo Ticket
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Filter size={20} />
            Filtros
          </button>
          
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Grid3X3 size={20} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <List size={20} />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(columns).map(([status, column]) => (
              <div key={status} className="flex flex-col">
                <div className={`flex items-center gap-2 p-3 rounded-t-lg border ${column.color}`}>
                  {column.icon}
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {column.title}
                  </h3>
                  <span className="ml-auto bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm">
                    {filteredTickets.filter(ticket => ticket.status === status).length}
                  </span>
                </div>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[500px] p-2 bg-gray-50 dark:bg-gray-900 rounded-b-lg ${
                        snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {filteredTickets
                        .filter(ticket => ticket.status === status)
                        .map((ticket, index) => (
                          <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-move ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                                    {ticket.lastMessage}
                                  </h4>
                                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <MoreVertical size={16} />
                                  </button>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
                                  {ticket.lastMessage}
                                </p>
                                
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-1">
                                    <User size={14} className="text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {ticket.contact.name}
                                    </span>
                                  </div>
                                  {ticket.unreadMessages > 0 && (
                                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                      {ticket.unreadMessages}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(ticket.updatedAt)}
                                  </span>
                                </div>
                                
                                {ticket.tags && ticket.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {ticket.tags.slice(0, 2).map((tag, index) => (
                                      <span
                                        key={index}
                                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                                      >
                                        {tag.name}
                                      </span>
                                    ))}
                                    {ticket.tags.length > 2 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{ticket.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Última Actualización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ticket.lastMessage}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ticket.lastMessage}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {ticket.contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'closed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {columns[ticket.status as keyof typeof columns]?.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)} mr-2`} />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {ticket.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(ticket.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets; 