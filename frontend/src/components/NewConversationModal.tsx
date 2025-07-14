import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, MessageSquare } from 'lucide-react';

import { contactService, Contact } from '../services/contactService';
import { connectionService, Connection } from '../services/connectionService';
import conversationService from '../services/conversationService';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Cargar contactos y conexiones cuando se abre el modal
      const fetchData = async () => {
        try {
          const contactsResponse = await contactService.getAll({ limit: 1000 }); // Cargar todos los contactos
          const connectionsResponse = await connectionService.getAll();
          setContacts(contactsResponse.data || []);
          setConnections(connectionsResponse.data || []);
        } catch (error) {
          toast.error('Error al cargar datos para la conversación');
          console.error(error);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleCreateConversation = async () => {
    if (!selectedContact || !selectedConnection) {
      toast.error('Debes seleccionar un contacto y una conexión');
      return;
    }

    setIsCreating(true);
    try {
      await conversationService.createConversation(selectedContact, selectedConnection);
      toast.success('Conversación iniciada!');
      onClose();
      navigate('/conversations');
    } catch (error) {
      toast.error('Error al iniciar la conversación');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Conversación</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contacto
            </label>
            <select
              id="contact"
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecciona un contacto</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="connection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conexión (Desde qué número enviar)
            </label>
            <select
              id="connection"
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecciona una conexión</option>
              {connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {isCreating ? 'Iniciando...' : <><MessageSquare className="w-4 h-4 mr-2" /> Iniciar Conversación</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal; 