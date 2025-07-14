import React, { useState, useEffect, useCallback } from 'react';
import tagService, { Tag } from '../services/tagService';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2 } from 'lucide-react';

const Tags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [newAttribute, setNewAttribute] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedTags = await tagService.getTags();
      const fetchedAttributes = await tagService.getAttributes();
      setTags(fetchedTags);
      setAttributes(fetchedAttributes);
    } catch (error) {
      toast.error('Error al cargar las etiquetas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttribute.trim() || !newValue.trim()) {
      toast.error('El atributo y el valor son obligatorios.');
      return;
    }

    try {
      await tagService.createTag({ attribute: newAttribute, value: newValue });
      toast.success('Etiqueta creada exitosamente.');
      setNewAttribute('');
      setNewValue('');
      fetchTags(); // Recargar lista
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al crear la etiqueta.');
      }
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta etiqueta?')) {
      try {
        await tagService.deleteTag(id);
        toast.success('Etiqueta eliminada exitosamente.');
        fetchTags(); // Recargar lista
      } catch (error: any) {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Error al eliminar la etiqueta.');
        }
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Gestión de Etiquetas</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Crear Nueva Etiqueta</h2>
        <form onSubmit={handleCreateTag} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full">
            <label htmlFor="attribute-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atributo</label>
            <input
              id="attribute-input"
              type="text"
              list="attributes-datalist"
              value={newAttribute}
              onChange={(e) => setNewAttribute(e.target.value)}
              placeholder="Ej: Prioridad"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <datalist id="attributes-datalist">
              {attributes.map(attr => <option key={attr} value={attr} />)}
            </datalist>
          </div>
          <div className="w-full">
            <label htmlFor="value-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
            <input
              id="value-input"
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Ej: Alta"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            Crear
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Etiquetas Existentes</h2>
        {isLoading ? (
          <p>Cargando etiquetas...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Atributo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tags.length > 0 ? tags.map(tag => (
                  <tr key={tag.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tag.attribute}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{tag.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleDeleteTag(tag.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No se encontraron etiquetas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags; 