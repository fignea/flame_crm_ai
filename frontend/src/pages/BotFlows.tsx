import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Pause, GitBranch } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { botFlowService, BotFlow } from '../services/botFlowService';
import BotFlowModal from '../components/BotFlowModal';
import BotFlowEditor from '../components/BotFlowEditor';

const BotFlows: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState<BotFlow | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadFlows();
    }
  }, [isAuthenticated]);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const response = await botFlowService.getFlows();
      setFlows(response.data);
    } catch (error) {
      console.error('Error cargando flujos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFlow(null);
    setShowModal(true);
  };

  const handleEdit = (flow: BotFlow) => {
    setEditingFlow(flow);
    setShowModal(true);
  };

  const handleOpenEditor = (flow: BotFlow) => {
    setEditingFlow(flow);
    // TODO: Implementar editor
    // console.log(Abrir editor para:', flow.name);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este flujo?')) {
      try {
        await botFlowService.deleteFlow(id);
        loadFlows();
      } catch (error) {
        console.error('Error eliminando flujo:', error);
      }
    }
  };

  const handleToggleStatus = async (flow: BotFlow) => {
    try {
      await botFlowService.updateFlow(flow.id, {
        ...flow,
        isActive: !flow.isActive
      });
      loadFlows();
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingFlow(null);
  };

  const handleModalSave = async () => {
    await loadFlows();
    handleModalClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flujos de Bot</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Flujo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conexión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{flow.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {flow.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flow.connection?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      flow.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {flow.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(flow.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditor(flow)}
                        className="text-purple-600 hover:text-purple-900 p-1"
                        title="Editor de flujo"
                      >
                        <GitBranch size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(flow)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(flow)}
                        className={`p-1 ${
                          flow.isActive 
                            ? 'text-orange-600 hover:text-orange-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={flow.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {flow.isActive ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(flow.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {flows.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No hay flujos de bot configurados</div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus size={20} />
              Crear primer flujo
            </button>
          </div>
        )}
      </div>

      <BotFlowModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleModalSave}
        botFlow={editingFlow}
      />

      <BotFlowEditor
        botFlow={editingFlow}
        onSave={handleModalSave}
        onCancel={() => setEditingFlow(null)}
      />
    </div>
  );
};

export default BotFlows; 