import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Tag } from 'lucide-react';

import { Conversation } from '../services/conversationService';
import tagService, { Tag as TagType } from '../services/tagService';
import conversationService from '../services/conversationService';

interface ConvertToTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticket: any) => void;
  conversation: Conversation | null;
}

const ConvertToTicketModal: React.FC<ConvertToTicketModalProps> = ({ isOpen, onClose, onSuccess, conversation }) => {
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchTags = async () => {
        try {
          const fetchedTags = await tagService.getTags();
          setTags(fetchedTags);
        } catch (error) {
          toast.error('Error al cargar los tags');
          console.error(error);
        }
      };
      fetchTags();
    }
  }, [isOpen]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleConvert = async () => {
    if (!conversation) return;
    if (!subject.trim()) {
      toast.error('El título del ticket es obligatorio');
      return;
    }
    setIsConverting(true);
    try {
      const newTicket = await conversationService.convertToTicket(conversation.id, selectedTags, subject);
      toast.success('Conversación convertida a ticket!');
      onSuccess(newTicket);
      onClose();
    } catch (error) {
      toast.error('Error al convertir a ticket');
      console.error(error);
    } finally {
      setIsConverting(false);
    }
  };

  if (!isOpen || !conversation) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Convertir a Ticket</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Asigna tags a la conversación con <span className="font-bold">{conversation.contact.name}</span> para crear un nuevo ticket.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título del Ticket
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Ej: Consulta de pago"
            disabled={isConverting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags Disponibles
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className={`px-3 py-1 text-sm rounded-full border ${selectedTags.includes(tag.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
              >
                {`${tag.attribute}: ${tag.value}`}
              </button>
            ))}
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
            onClick={handleConvert}
            disabled={isConverting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isConverting ? 'Convirtiendo...' : <><Tag className="w-4 h-4 mr-2" /> Convertir a Ticket</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertToTicketModal; 