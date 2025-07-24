import React, { useState, useEffect } from 'react';
import { Contact } from '../types/api';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (conversationData: { contactId: string; initialMessage: string }) => void;
  contacts: Contact[];
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  contacts
}) => {
  const [selectedContactId, setSelectedContactId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    if (contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContactId) {
      onCreate({
        contactId: selectedContactId,
        initialMessage
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Nueva Conversación</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contacto
            </label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccionar contacto</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.number})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje Inicial (Opcional)
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              placeholder="Escribe un mensaje inicial para la conversación..."
            />
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
              disabled={!selectedContactId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Crear Conversación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversationModal; 