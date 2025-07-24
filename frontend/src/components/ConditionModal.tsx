import React, { useState, useEffect } from 'react';
import { BotFlowCondition } from '../types/api';

interface ConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (condition: Partial<BotFlowCondition>) => void;
  condition?: BotFlowCondition | null;
}

const ConditionModal: React.FC<ConditionModalProps> = ({ isOpen, onClose, onSave, condition }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditionType: 'text_match' as 'text_match' | 'keyword' | 'intent' | 'time',
    parameters: {}
  });

  useEffect(() => {
    if (condition) {
      setFormData({
        name: condition.name || '',
        description: condition.description || '',
        conditionType: condition.conditionType || 'text_match',
        parameters: condition.parameters || {}
      });
    } else {
      setFormData({
        name: '',
        description: '',
        conditionType: 'text_match',
        parameters: {}
      });
    }
  }, [condition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {condition ? 'Editar Condición' : 'Nueva Condición'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Condición
            </label>
            <select
              value={formData.conditionType}
              onChange={(e) => setFormData({ ...formData, conditionType: e.target.value as 'text_match' | 'keyword' | 'intent' | 'time' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="text_match">Coincidencia de texto</option>
              <option value="keyword">Palabra clave</option>
              <option value="intent">Intención</option>
              <option value="time">Tiempo</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {condition ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConditionModal; 