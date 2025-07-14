import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { botFlowService, BotFlow, CreateBotFlowData } from '../services/botFlowService';
import { Connection } from '../services/connectionService';

interface BotFlowModalProps {
  flow?: BotFlow | null;
  connections: Connection[];
  onClose: () => void;
  onSave: () => void;
}

const BotFlowModal: React.FC<BotFlowModalProps> = ({ flow, connections, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreateBotFlowData>({
    name: '',
    description: '',
    connectionId: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (flow) {
      setFormData({
        name: flow.name,
        description: flow.description,
        connectionId: flow.connectionId,
        isActive: flow.isActive
      });
    }
  }, [flow]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.connectionId) {
      newErrors.connectionId = 'Debe seleccionar una conexión';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (flow) {
        await botFlowService.updateFlow(flow.id, formData);
      } else {
        await botFlowService.createFlow(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error guardando flujo:', error);
      setErrors({ submit: 'Error al guardar el flujo' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBotFlowData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {flow ? 'Editar Flujo de Bot' : 'Nuevo Flujo de Bot'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Flujo *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Atención al Cliente"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe el propósito de este flujo de bot"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="connectionId" className="block text-sm font-medium text-gray-700 mb-2">
              Conexión de WhatsApp *
            </label>
            <select
              id="connectionId"
              value={formData.connectionId}
              onChange={(e) => handleInputChange('connectionId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.connectionId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar conexión</option>
              {connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.name} ({connection.type})
                </option>
              ))}
            </select>
            {errors.connectionId && (
              <p className="mt-1 text-sm text-red-600">{errors.connectionId}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Activar flujo automáticamente
            </label>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              {flow ? 'Actualizar' : 'Crear'} Flujo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BotFlowModal; 