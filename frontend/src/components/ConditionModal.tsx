import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { botFlowService, BotCondition } from '../services/botFlowService';

interface ConditionModalProps {
  condition?: BotCondition | null;
  parentConditionId?: string | null;
  botFlowId: string;
  onClose: () => void;
  onSave: () => void;
}

const ConditionModal: React.FC<ConditionModalProps> = ({ condition, parentConditionId, botFlowId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    field: '',
    operator: 'equals',
    value: '',
    order: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (condition) {
      setFormData({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        order: condition.order
      });
    }
  }, [condition]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.field.trim()) {
      newErrors.field = 'El campo es requerido';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'El valor es requerido';
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
      if (condition) {
        await botFlowService.updateCondition(condition.id, formData);
      } else {
        await botFlowService.createCondition(botFlowId, {
          ...formData,
          parentConditionId: parentConditionId || undefined
        });
      }
      onSave();
    } catch (error) {
      console.error('Error guardando condición:', error);
      setErrors({ submit: 'Error al guardar la condición' });
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

  const fieldOptions = [
    { value: 'message', label: 'Mensaje del usuario' },
    { value: 'contact.name', label: 'Nombre del contacto' },
    { value: 'contact.number', label: 'Número del contacto' },
    { value: 'contact.email', label: 'Email del contacto' },
    { value: 'ticket.status', label: 'Estado del ticket' },
    { value: 'ticket.queue', label: 'Cola del ticket' },
    { value: 'user.profile', label: 'Perfil del usuario' }
  ];

  const operatorOptions = [
    { value: 'equals', label: 'Igual a' },
    { value: 'contains', label: 'Contiene' },
    { value: 'starts_with', label: 'Empieza con' },
    { value: 'ends_with', label: 'Termina con' },
    { value: 'not_equals', label: 'No igual a' },
    { value: 'not_contains', label: 'No contiene' },
    { value: 'regex', label: 'Expresión regular' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {condition ? 'Editar Condición' : 'Nueva Condición'}
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
            <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-2">
              Campo a evaluar *
            </label>
            <select
              id="field"
              value={formData.field}
              onChange={(e) => handleInputChange('field', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.field ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar campo</option>
              {fieldOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.field && (
              <p className="mt-1 text-sm text-red-600">{errors.field}</p>
            )}
          </div>

          <div>
            <label htmlFor="operator" className="block text-sm font-medium text-gray-700 mb-2">
              Operador
            </label>
            <select
              id="operator"
              value={formData.operator}
              onChange={(e) => handleInputChange('operator', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {operatorOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Valor a comparar *
            </label>
            <input
              type="text"
              id="value"
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.value ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: hola, ayuda, soporte"
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600">{errors.value}</p>
            )}
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
              Orden de evaluación
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
              Las condiciones se evalúan en orden ascendente (0, 1, 2...)
            </p>
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
              {condition ? 'Actualizar' : 'Crear'} Condición
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConditionModal; 