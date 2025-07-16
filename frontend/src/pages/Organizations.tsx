import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { organizationService, Organization, OrganizationCreateData, OrganizationFilters } from '../services/organizationService';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
const Organizations: React.FC = () => {
  const { } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados para filtros
  const [filters, setFilters] = useState<OrganizationFilters>({
    page: 1,
    limit: 20,
    search: '',
    industry: '',
    companySize: '',
    city: '',
    state: '',
    country: '',
    status: ''
  });
  
  // Estados para modales y UI
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [viewOrganization, setViewOrganization] = useState<Organization | null>(null);
  
  // Estados para formulario
  const [newOrganization, setNewOrganization] = useState<OrganizationCreateData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    industry: '',
    companySize: '',
    vatNumber: '',
    description: '',
    notes: '',
    logo: ''
  });

  // Estados para opciones de filtro
  // const [industries, setIndustries] = useState<string[]>([]);
  // const [companySizes, setCompanySizes] = useState<string[]>([]);

  // Cargar organizaciones
  useEffect(() => {
    loadOrganizations();
  }, [currentPage, filters]);

  // Cargar opciones de filtro
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const result = await organizationService.getAll({
        ...filters,
        page: currentPage
      });
      setOrganizations(result.data || []);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Error al cargar las organizaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // const [industriesData, sizesData] = await Promise.all([
      //   organizationService.getIndustries(),
      //   organizationService.getCompanySizes()
      // ]);
      // setIndustries(industriesData);
      // setCompanySizes(sizesData);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      if (!newOrganization.name) {
        toast.error('El nombre de la organización es requerido');
        return;
      }

      await organizationService.create(newOrganization);
      toast.success('Organización creada exitosamente');
      setShowCreateModal(false);
      resetForm();
      loadOrganizations();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la organización');
    }
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrganization) return;
    
    try {
      await organizationService.update(editingOrganization.id, editingOrganization);
      toast.success('Organización actualizada exitosamente');
      setShowEditModal(false);
      setEditingOrganization(null);
      loadOrganizations();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la organización');
    }
  };

  const handleDeleteOrganization = async (organization: Organization) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la organización "${organization.name}"?`)) {
      return;
    }

    try {
      await organizationService.delete(organization.id);
      toast.success('Organización eliminada exitosamente');
      loadOrganizations();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la organización');
    }
  };

  const handleEditOrganization = (organization: Organization) => {
    setEditingOrganization({ ...organization });
    setShowEditModal(true);
  };

  const handleViewOrganization = (organization: Organization) => {
    setViewOrganization(organization);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setNewOrganization({
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      industry: '',
      companySize: '',
      vatNumber: '',
      description: '',
      notes: '',
      logo: ''
    });
  };

  const handleFilterChange = (key: keyof OrganizationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      industry: '',
      companySize: '',
      city: '',
      state: '',
      country: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const industryOptions = [
    { value: 'technology', label: 'Tecnología' },
    { value: 'healthcare', label: 'Salud' },
    { value: 'finance', label: 'Finanzas' },
    { value: 'education', label: 'Educación' },
    { value: 'retail', label: 'Comercio' },
    { value: 'manufacturing', label: 'Manufactura' },
    { value: 'construction', label: 'Construcción' },
    { value: 'consulting', label: 'Consultoría' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'real_estate', label: 'Inmobiliario' },
    { value: 'transportation', label: 'Transporte' },
    { value: 'hospitality', label: 'Hospitalidad' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'agriculture', label: 'Agricultura' },
    { value: 'energy', label: 'Energía' },
    { value: 'telecommunications', label: 'Telecomunicaciones' },
    { value: 'insurance', label: 'Seguros' },
    { value: 'legal', label: 'Legal' },
    { value: 'nonprofit', label: 'Sin fines de lucro' },
    { value: 'government', label: 'Gobierno' },
    { value: 'other', label: 'Otro' }
  ];

  const sizeOptions = [
    { value: 'small', label: 'Pequeña (1-50)' },
    { value: 'medium', label: 'Mediana (51-200)' },
    { value: 'large', label: 'Grande (201-1000)' },
    { value: 'enterprise', label: 'Empresa (1000+)' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'suspended', label: 'Suspendida' }
  ];

  return (
    <div className={`flex-1 transition-all duration-300`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Organizaciones
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona las organizaciones y empresas cliente
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nueva Organización
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar organizaciones..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Botón de filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter size={20} />
                Filtros
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Industria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Industria
                  </label>
                  <select
                    value={filters.industry}
                    onChange={(e) => handleFilterChange('industry', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas las industrias</option>
                    {industryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tamaño */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tamaño
                  </label>
                  <select
                    value={filters.companySize}
                    onChange={(e) => handleFilterChange('companySize', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los tamaños</option>
                    {sizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los estados</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar por ciudad"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de organizaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organización
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Industria
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contactos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron organizaciones
                    </td>
                  </tr>
                ) : (
                  organizations.map((organization) => (
                    <tr key={organization.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {/* Nombre y descripción */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {organization.name}
                            </div>
                            {organization.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {organization.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {organization.email && (
                            <div className="flex items-center gap-1">
                              <Mail size={14} />
                              {organization.email}
                            </div>
                          )}
                          {organization.phone && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone size={14} />
                              {organization.phone}
                            </div>
                          )}
                          {organization.website && (
                            <div className="flex items-center gap-1 mt-1">
                              <Globe size={14} />
                              <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Sitio web
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {organization.city && (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              {organization.city}
                              {organization.state && `, ${organization.state}`}
                            </div>
                          )}
                          {organization.country && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {organization.country}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Industria */}
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                        {organization.industry && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {organizationService.getIndustryDisplayName(organization.industry)}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${organizationService.getStatusColor(organization.status)}`}>
                          {organizationService.getStatusDisplayName(organization.status)}
                        </span>
                      </td>

                      {/* Contactos */}
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Users size={14} />
                          {organization._count?.contacts || 0}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewOrganization(organization)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditOrganization(organization)}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteOrganization(organization)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Modal de crear organización */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nueva Organización
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Información básica */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={newOrganization.name}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Nombre de la organización"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newOrganization.email}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="email@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={newOrganization.phone}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sitio web
                    </label>
                    <input
                      type="url"
                      value={newOrganization.website}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Industria
                    </label>
                    <select
                      value={newOrganization.industry}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar industria</option>
                      {industryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tamaño de empresa
                    </label>
                    <select
                      value={newOrganization.companySize}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, companySize: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar tamaño</option>
                      {sizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={newOrganization.address}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={newOrganization.city}
                        onChange={(e) => setNewOrganization(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ciudad"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Provincia/Estado
                      </label>
                      <input
                        type="text"
                        value={newOrganization.state}
                        onChange={(e) => setNewOrganization(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Provincia"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        País
                      </label>
                      <input
                        type="text"
                        value={newOrganization.country}
                        onChange={(e) => setNewOrganization(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="País"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código postal
                      </label>
                      <input
                        type="text"
                        value={newOrganization.postalCode}
                        onChange={(e) => setNewOrganization(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Código postal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número de IVA/RUT/CUIT
                    </label>
                    <input
                      type="text"
                      value={newOrganization.vatNumber}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, vatNumber: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Número de identificación fiscal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={newOrganization.description}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Descripción de la organización"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas internas
                    </label>
                    <textarea
                      value={newOrganization.notes}
                      onChange={(e) => setNewOrganization(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Notas internas"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateOrganization}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Organización
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar organización */}
      {showEditModal && editingOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Editar Organización
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Información básica */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={editingOrganization.name}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Nombre de la organización"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingOrganization.email || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="email@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editingOrganization.phone || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sitio web
                    </label>
                    <input
                      type="url"
                      value={editingOrganization.website || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, website: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Industria
                    </label>
                    <select
                      value={editingOrganization.industry || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, industry: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar industria</option>
                      {industryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tamaño de empresa
                    </label>
                    <select
                      value={editingOrganization.companySize || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, companySize: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar tamaño</option>
                      {sizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={editingOrganization.address || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={editingOrganization.city || ''}
                        onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, city: e.target.value }) : null)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ciudad"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Provincia/Estado
                      </label>
                      <input
                        type="text"
                        value={editingOrganization.state || ''}
                        onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, state: e.target.value }) : null)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Provincia"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        País
                      </label>
                      <input
                        type="text"
                        value={editingOrganization.country || ''}
                        onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, country: e.target.value }) : null)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="País"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código postal
                      </label>
                      <input
                        type="text"
                        value={editingOrganization.postalCode || ''}
                        onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, postalCode: e.target.value }) : null)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Código postal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número de IVA/RUT/CUIT
                    </label>
                    <input
                      type="text"
                      value={editingOrganization.vatNumber || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, vatNumber: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Número de identificación fiscal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={editingOrganization.description || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Descripción de la organización"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas internas
                    </label>
                    <textarea
                      value={editingOrganization.notes || ''}
                      onChange={(e) => setEditingOrganization(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Notas internas"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateOrganization}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Actualizar Organización
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista de organización */}
      {showViewModal && viewOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalles de la Organización
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información principal */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Información General
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.name}</span>
                      </div>
                      
                      {viewOrganization.email && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                          <span className="ml-2 text-blue-600 dark:text-blue-400">{viewOrganization.email}</span>
                        </div>
                      )}
                      
                      {viewOrganization.phone && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Teléfono:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.phone}</span>
                        </div>
                      )}
                      
                      {viewOrganization.website && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Sitio web:</span>
                          <a
                            href={viewOrganization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {viewOrganization.website}
                          </a>
                        </div>
                      )}
                      
                      {viewOrganization.industry && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Industria:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {organizationService.getIndustryDisplayName(viewOrganization.industry)}
                          </span>
                        </div>
                      )}
                      
                      {viewOrganization.companySize && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Tamaño:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {organizationService.getCompanySizeDisplayName(viewOrganization.companySize)}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${organizationService.getStatusColor(viewOrganization.status)}`}>
                          {organizationService.getStatusDisplayName(viewOrganization.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  {(viewOrganization.address || viewOrganization.city || viewOrganization.state || viewOrganization.country || viewOrganization.postalCode) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Ubicación
                      </h3>
                      <div className="space-y-2">
                        {viewOrganization.address && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Dirección:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.address}</span>
                          </div>
                        )}
                        
                        {viewOrganization.city && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Ciudad:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.city}</span>
                          </div>
                        )}
                        
                        {viewOrganization.state && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Provincia/Estado:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.state}</span>
                          </div>
                        )}
                        
                        {viewOrganization.country && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">País:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.country}</span>
                          </div>
                        )}
                        
                        {viewOrganization.postalCode && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Código postal:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.postalCode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                <div className="space-y-4">
                  {/* Estadísticas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Estadísticas
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="text-blue-600 dark:text-blue-400" size={20} />
                          <span className="text-gray-700 dark:text-gray-300">Contactos</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {viewOrganization._count?.contacts || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información fiscal */}
                  {viewOrganization.vatNumber && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Información Fiscal
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Número de IVA/RUT/CUIT:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{viewOrganization.vatNumber}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Descripción */}
                  {viewOrganization.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Descripción
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {viewOrganization.description}
                      </p>
                    </div>
                  )}

                  {/* Notas internas */}
                  {viewOrganization.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Notas Internas
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {viewOrganization.notes}
                      </p>
                    </div>
                  )}

                  {/* Fechas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Información del Sistema
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Creado:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(viewOrganization.createdAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Actualizado:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(viewOrganization.updatedAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditOrganization(viewOrganization);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations; 