import React, { useState } from 'react';

interface ExportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, filters: any) => void;
  totalContacts: number;
  currentFilters?: any;
}

const ExportContactsModal: React.FC<ExportContactsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  totalContacts
}) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeFilters, setIncludeFilters] = useState(false);

  const handleExport = () => {
    onExport(exportFormat, includeFilters ? {} : {});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Exportar Contactos</h2>
        <p className="text-gray-600 mb-4">
          Total de contactos a exportar: <strong>{totalContacts}</strong>
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formato de Exportación
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="json">JSON</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeFilters"
              checked={includeFilters}
              onChange={(e) => setIncludeFilters(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="includeFilters" className="text-sm font-medium text-gray-700">
              Incluir filtros aplicados
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
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportContactsModal; 