import React, { useState, useEffect } from 'react';
import { BotFlow } from '../types/api';

interface BotFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (botFlow: Partial<BotFlow>) => void;
  botFlow?: BotFlow | null;
  flow?: BotFlow | null;
}

const BotFlowModal: React.FC<BotFlowModalProps> = ({ isOpen, onClose, onSave, botFlow }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    if (botFlow) {
      setFormData({
        name: botFlow.name || '',
        description: botFlow.description || '',
        isActive: botFlow.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true
      });
    }
  }, [botFlow]);

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
          {botFlow ? 'Editar Flujo de Bot' : 'Nuevo Flujo de Bot'}
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
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Activo
            </label>
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
              {botFlow ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BotFlowModal; 