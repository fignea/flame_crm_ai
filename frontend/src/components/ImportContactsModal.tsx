import React, { useState } from 'react';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, options: any) => void;
  onSuccess?: (result: any) => void;
}

const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    createTags: true
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile, importOptions);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Importar Contactos</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo a Importar
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos soportados: CSV, Excel (XLSX), JSON
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="skipDuplicates"
                checked={importOptions.skipDuplicates}
                onChange={(e) => setImportOptions({ ...importOptions, skipDuplicates: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="skipDuplicates" className="text-sm font-medium text-gray-700">
                Omitir duplicados
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateExisting"
                checked={importOptions.updateExisting}
                onChange={(e) => setImportOptions({ ...importOptions, updateExisting: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="updateExisting" className="text-sm font-medium text-gray-700">
                Actualizar contactos existentes
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createTags"
                checked={importOptions.createTags}
                onChange={(e) => setImportOptions({ ...importOptions, createTags: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="createTags" className="text-sm font-medium text-gray-700">
                Crear etiquetas automáticamente
              </label>
            </div>
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
              onClick={handleImport}
              disabled={!selectedFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Importar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportContactsModal; 