import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { botFlowService, BotResponse } from '../services/botFlowService';

interface ResponseModalProps {
  response?: BotResponse | null;
  conditionId: string;
  onClose: () => void;
  onSave: () => void;
}

const ResponseModal: React.FC<ResponseModalProps> = ({ response, conditionId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    message: '',
    order: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (response) {
      setFormData({
        message: response.message,
        order: response.order
      });
    }
  }, [response]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido';
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
      if (response) {
        await botFlowService.updateResponse(response.id, formData);
      } else {
        await botFlowService.createResponse(conditionId, formData);
      }
      onSave();
    } catch (error) {
      console.error('Error guardando respuesta:', error);
      setErrors({ submit: 'Error al guardar la respuesta' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
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
            {response ? 'Editar Respuesta' : 'Nueva Respuesta'}
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
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje de respuesta *
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Escribe el mensaje que se enviará cuando se cumpla esta condición..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Puedes usar variables como {'{{contact.name}}'}, {'{{contact.number}}'}, etc.
            </p>
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
              Orden de envío
            </label>
            <input
              type="number"
              id="order"
              value={formData.order}
              onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Si hay múltiples respuestas, se enviarán en orden ascendente
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Variables disponibles:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
              <div><code>{'{{contact.name}}'}</code> - Nombre del contacto</div>
              <div><code>{'{{contact.number}}'}</code> - Número del contacto</div>
              <div><code>{'{{contact.email}}'}</code> - Email del contacto</div>
              <div><code>{'{{ticket.number}}'}</code> - Número del ticket</div>
              <div><code>{'{{ticket.status}}'}</code> - Estado del ticket</div>
              <div><code>{'{{user.name}}'}</code> - Nombre del usuario</div>
            </div>
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
              {response ? 'Actualizar' : 'Crear'} Respuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResponseModal; 