import React, { useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types/api';

interface ConvertToTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (ticketData: Partial<Ticket>) => void;
  contactName: string;
  onSuccess?: () => void;
}

const ConvertToTicketModal: React.FC<ConvertToTicketModalProps> = ({
  isOpen,
  onClose,
  onConvert,
  contactName
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    priority: 'medium' as TicketPriority,
    status: 'open' as TicketStatus,
    assignedTo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConvert({
      subject: formData.subject,
      priority: formData.priority,
      status: formData.status
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Convertir a Ticket</h2>
        <p className="text-gray-600 mb-4">
          Conversación con: <strong>{contactName}</strong>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asunto del Ticket
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="open">Abierto</option>
              <option value="pending">Pendiente</option>
              <option value="waiting">En Espera</option>
              <option value="closed">Cerrado</option>
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
              Convertir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertToTicketModal; 