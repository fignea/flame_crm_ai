import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { contactService, Contact, ContactCreateData, ContactFilters } from '../services/contactService';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  User,
  UserCheck,
  UserX,
  Download,
  Upload,
  Filter,
  X,
  MessageCircle
} from 'lucide-react';
import NewConversationModal from '../components/NewConversationModal';
import ImportContactsModal from '../components/ImportContactsModal';
import ExportContactsModal from '../components/ExportContactsModal';
import { useSidebar } from '../contexts/SidebarContext';

const Contacts: React.FC = () => {
  const { } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados para filtros avanzados
  const [filters, setFilters] = useState<ContactFilters>({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    tag: '',
    city: '',
    state: '',
    country: '',
    companyName: '',
    position: '',
    customerType: '',
    birthday: '',
    notes: '',
    socials: '',
    organizationId: ''
  });
  
  // Estados para modales y UI
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newContact, setNewContact] = useState<ContactCreateData>({
    name: '',
    number: '',
    email: '',
    companyName: '',
    position: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    birthday: '',
    status: '',
    customerType: '',
    socials: {},
    notes: '',
    organizationId: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);

  const { isSidebarCollapsed } = useSidebar();

  // Cargar contactos
  useEffect(() => {
    loadContacts();
  }, [currentPage, filters]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const result = await contactService.getAll({
        ...filters,
        page: currentPage
      });
      setContacts(result.data || []);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Error al cargar los contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      if (!newContact.name || !newContact.number) {
        toast.error('Nombre y número son requeridos');
        return;
      }

      await contactService.create(newContact);
      toast.success('Contacto creado exitosamente');
      setShowCreateModal(false);
      setNewContact({
        name: '',
        number: '',
        email: '',
        companyName: '',
        position: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        birthday: '',
        status: '',
        customerType: '',
        socials: {},
        notes: ''
      });
      loadContacts();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el contacto');
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${contact.name}?`)) {
      return;
    }

    try {
      await contactService.delete(contact.id);
      toast.success('Contacto eliminado exitosamente');
      loadContacts();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el contacto');
    }
  };

  const handleToggleBlock = async (contact: Contact) => {
    try {
      await contactService.update(contact.id, {
        isBlocked: !contact.isBlocked
      });
      toast.success(`Contacto ${contact.isBlocked ? 'desbloqueado' : 'bloqueado'} exitosamente`);
      loadContacts();
    } catch (error) {
      toast.error('Error al cambiar el estado del contacto');
    }
  };

  // Función para abrir modal de edición
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  // Función para abrir modal de vista
  const handleViewContact = (contact: Contact) => {
    setViewContact(contact);
    setShowViewModal(true);
  };

  // Función para guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editingContact) return;
    try {
      await contactService.update(editingContact.id, editingContact);
      toast.success('Contacto actualizado exitosamente');
      setShowEditModal(false);
      setEditingContact(null);
      loadContacts();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el contacto');
    }
  };

  // Función para manejar importación exitosa
  const handleImportSuccess = (result: any) => {
    toast.success(`Importación completada: ${result.imported} contactos importados`);
    if (result.duplicates > 0) {
      toast.success(`${result.duplicates} contactos duplicados omitidos`);
    }
    if (result.errors > 0) {
      toast.error(`${result.errors} errores durante la importación`);
    }
    loadContacts();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Overlay oscuro en mobile cuando el sidebar está abierto */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Sidebar de filtros */}
      <div
        className={`
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300
          fixed inset-0 z-40 w-80
          lg:static lg:inset-auto lg:z-auto
          ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!isSidebarCollapsed ? 'ml-64' : 'ml-16'} lg:ml-0
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Búsqueda general */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Búsqueda general
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, email..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filtros por campo */}
          <div className="space-y-4">
            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                placeholder="Filtrar por ciudad"
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provincia
              </label>
              <input
                type="text"
                placeholder="Filtrar por provincia"
                value={filters.state}
                onChange={(e) => setFilters({...filters, state: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                País
              </label>
              <input
                type="text"
                placeholder="Filtrar por país"
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Empresa
              </label>
              <input
                type="text"
                placeholder="Filtrar por empresa"
                value={filters.companyName}
                onChange={(e) => setFilters({...filters, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargo
              </label>
              <input
                type="text"
                placeholder="Filtrar por cargo"
                value={filters.position}
                onChange={(e) => setFilters({...filters, position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Tipo de cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de cliente
              </label>
              <input
                type="text"
                placeholder="Filtrar por tipo"
                value={filters.customerType}
                onChange={(e) => setFilters({...filters, customerType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Cumpleaños */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cumpleaños
              </label>
              <input
                type="date"
                value={filters.birthday}
                onChange={(e) => setFilters({...filters, birthday: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Redes sociales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Redes sociales
              </label>
              <input
                type="text"
                placeholder="Buscar en redes sociales"
                value={filters.socials}
                onChange={(e) => setFilters({...filters, socials: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Limpiar filtros */}
            <button
              onClick={() => setFilters({
                page: 1,
                limit: 20,
                search: '',
                status: '',
                tag: '',
                city: '',
                state: '',
                country: '',
                companyName: '',
                position: '',
                customerType: '',
                birthday: '',
                notes: '',
                socials: ''
              })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Contactos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona tu base de datos de clientes y prospectos
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Botón de filtros para móvil */}
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </button>
              
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Contacto
              </button>
            </div>
          </div>
        </div>

        {/* Contenido de la tabla */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6">
              {/* Tabla responsive */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {/* Información del contacto */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {contact.avatar ? (
                                  <img className="h-10 w-10 rounded-full" src={contact.avatar} alt={contact.name} />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {contact.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {contact.number}
                                </div>
                                {contact.email && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {contact.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Empresa */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {contact.companyName || '-'}
                            </div>
                            {contact.position && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {contact.position}
                              </div>
                            )}
                          </td>

                          {/* Ubicación */}
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {contact.city && contact.state ? `${contact.city}, ${contact.state}` : contact.city || contact.state || '-'}
                            </div>
                            {contact.country && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {contact.country}
                              </div>
                            )}
                          </td>

                          {/* Tipo de cliente */}
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {contact.customerType || 'Cliente'}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              contact.isBlocked 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {contact.isBlocked ? 'Bloqueado' : 'Activo'}
                            </span>
                          </td>

                          {/* Tags */}
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                >
                                  {tag.attribute}: {tag.value}
                                </span>
                              ))}
                              {contact.tags.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  +{contact.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setShowNewConversationModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Nueva conversación"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewContact(contact)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Ver contacto"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditContact(contact)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleBlock(contact)}
                                className={`${
                                  contact.isBlocked 
                                    ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300' 
                                    : 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                                }`}
                                title={contact.isBlocked ? 'Desbloquear' : 'Bloquear'}
                              >
                                {contact.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Página <span className="font-medium">{currentPage}</span> de{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Siguiente
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Crear Nuevo Contacto</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información Básica */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ingrese el nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      value={newContact.number}
                      onChange={(e) => setNewContact({...newContact, number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={newContact.birthday}
                      onChange={(e) => setNewContact({...newContact, birthday: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={newContact.status}
                      onChange={(e) => setNewContact({...newContact, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Cliente
                    </label>
                    <select
                      value={newContact.customerType}
                      onChange={(e) => setNewContact({...newContact, customerType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="lead">Lead</option>
                      <option value="cliente">Cliente</option>
                      <option value="proveedor">Proveedor</option>
                      <option value="socio">Socio</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información Profesional */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información Profesional</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={newContact.companyName}
                      onChange={(e) => setNewContact({...newContact, companyName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={newContact.position}
                      onChange={(e) => setNewContact({...newContact, position: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Gerente, Director, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Información de Ubicación */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información de Ubicación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={newContact.address}
                      onChange={(e) => setNewContact({...newContact, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Dirección completa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={newContact.city}
                      onChange={(e) => setNewContact({...newContact, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ciudad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Provincia/Estado
                    </label>
                    <input
                      type="text"
                      value={newContact.state}
                      onChange={(e) => setNewContact({...newContact, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Provincia o estado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      value={newContact.country}
                      onChange={(e) => setNewContact({...newContact, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="País"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={newContact.postalCode}
                      onChange={(e) => setNewContact({...newContact, postalCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Código postal"
                    />
                  </div>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Redes Sociales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={newContact.socials?.linkedin || ''}
                      onChange={(e) => setNewContact({
                        ...newContact, 
                        socials: { ...newContact.socials, linkedin: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://linkedin.com/in/usuario"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={newContact.socials?.facebook || ''}
                      onChange={(e) => setNewContact({
                        ...newContact, 
                        socials: { ...newContact.socials, facebook: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://facebook.com/usuario"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={newContact.socials?.instagram || ''}
                      onChange={(e) => setNewContact({
                        ...newContact, 
                        socials: { ...newContact.socials, instagram: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://instagram.com/usuario"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      X (Twitter)
                    </label>
                    <input
                      type="url"
                      value={newContact.socials?.x || ''}
                      onChange={(e) => setNewContact({
                        ...newContact, 
                        socials: { ...newContact.socials, x: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://x.com/usuario"
                    />
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notas Adicionales</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={newContact.notes}
                    onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Información adicional sobre el contacto..."
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateContact}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Crear Contacto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nueva conversación */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
      />

      {/* Modal de importación de contactos */}
      <ImportContactsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Modal de exportación de contactos */}
      <ExportContactsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        currentFilters={filters}
      />

      {/* Modal de ver contacto */}
      {showViewModal && viewContact && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ver Contacto</h2>
              <button onClick={() => setShowViewModal(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              <div><span className="font-semibold">Nombre:</span> {viewContact.name}</div>
              <div><span className="font-semibold">Teléfono:</span> {viewContact.number}</div>
              {viewContact.email && <div><span className="font-semibold">Email:</span> {viewContact.email}</div>}
              {viewContact.companyName && <div><span className="font-semibold">Empresa:</span> {viewContact.companyName}</div>}
              {viewContact.position && <div><span className="font-semibold">Cargo:</span> {viewContact.position}</div>}
              {viewContact.city && <div><span className="font-semibold">Ciudad:</span> {viewContact.city}</div>}
              {viewContact.state && <div><span className="font-semibold">Provincia:</span> {viewContact.state}</div>}
              {viewContact.country && <div><span className="font-semibold">País:</span> {viewContact.country}</div>}
              {viewContact.customerType && <div><span className="font-semibold">Tipo de cliente:</span> {viewContact.customerType}</div>}
              {viewContact.status && <div><span className="font-semibold">Estado:</span> {viewContact.status}</div>}
              {viewContact.notes && <div><span className="font-semibold">Notas:</span> {viewContact.notes}</div>}
              {viewContact.socials && (
                <div><span className="font-semibold">Redes sociales:</span> {Object.entries(viewContact.socials).map(([k,v]) => v ? `${k}: ${v}` : null).filter(Boolean).join(', ')}</div>
              )}
              {viewContact.tags && viewContact.tags.length > 0 && (
                <div><span className="font-semibold">Etiquetas:</span> {viewContact.tags.map(tag => `${tag.attribute}: ${tag.value}`).join(', ')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar contacto */}
      {showEditModal && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Contacto</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <input type="text" value={editingContact.name} onChange={e => setEditingContact({ ...editingContact, name: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                <input type="text" value={editingContact.number} onChange={e => setEditingContact({ ...editingContact, number: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" value={editingContact.email || ''} onChange={e => setEditingContact({ ...editingContact, email: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                <input type="text" value={editingContact.companyName || ''} onChange={e => setEditingContact({ ...editingContact, companyName: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
                <input type="text" value={editingContact.position || ''} onChange={e => setEditingContact({ ...editingContact, position: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad</label>
                <input type="text" value={editingContact.city || ''} onChange={e => setEditingContact({ ...editingContact, city: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provincia</label>
                <input type="text" value={editingContact.state || ''} onChange={e => setEditingContact({ ...editingContact, state: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
                <input type="text" value={editingContact.country || ''} onChange={e => setEditingContact({ ...editingContact, country: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de cliente</label>
                <input type="text" value={editingContact.customerType || ''} onChange={e => setEditingContact({ ...editingContact, customerType: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label>
                <textarea value={editingContact.notes || ''} onChange={e => setEditingContact({ ...editingContact, notes: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts; 