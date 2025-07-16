import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { contactImportExportService, ExportOptions } from '../services/contactImportExportService';
import { X, Download, FileText, CheckSquare, Square } from 'lucide-react';

interface ExportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: any;
}

const ExportContactsModal: React.FC<ExportContactsModalProps> = ({ isOpen, onClose, currentFilters = {} }) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectAllFields, setSelectAllFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useCurrentFilters, setUseCurrentFilters] = useState(true);

  const availableFields = contactImportExportService.getAvailableFields();

  const handleFieldToggle = (fieldValue: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldValue) 
        ? prev.filter(f => f !== fieldValue)
        : [...prev, fieldValue]
    );
  };

  const handleSelectAllFields = () => {
    if (selectAllFields) {
      setSelectedFields([]);
    } else {
      setSelectedFields(availableFields.map(field => field.value));
    }
    setSelectAllFields(!selectAllFields);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const exportOptions: ExportOptions = {
        format: exportFormat,
        fields: selectedFields.length > 0 ? selectedFields : undefined,
        filters: useCurrentFilters ? currentFilters : undefined
      };

      const blob = await contactImportExportService.exportContacts(exportOptions);
      const filename = contactImportExportService.generateExportFilename(exportFormat);
      
      contactImportExportService.downloadBlob(blob, filename);
      toast.success('Contactos exportados exitosamente');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error exportando contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFields([]);
    setSelectAllFields(false);
    setExportFormat('csv');
    setUseCurrentFilters(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Exportar Contactos
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Formato de exportación */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato de exportación
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  exportFormat === 'csv'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <FileText size={16} />
                CSV
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  exportFormat === 'json'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <FileText size={16} />
                JSON
              </button>
            </div>
          </div>

          {/* Opciones de filtros */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtros
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useCurrentFilters"
                checked={useCurrentFilters}
                onChange={(e) => setUseCurrentFilters(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useCurrentFilters" className="text-sm text-gray-700 dark:text-gray-300">
                Usar filtros actuales de la lista
              </label>
            </div>
            {useCurrentFilters && Object.keys(currentFilters).length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Filtros activos:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currentFilters).map(([key, value]) => {
                    if (value && key !== 'page' && key !== 'limit') {
                      return (
                        <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {key}: {String(value)}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selección de campos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Campos a exportar
              </label>
              <button
                onClick={handleSelectAllFields}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {selectAllFields ? <CheckSquare size={16} /> : <Square size={16} />}
                {selectAllFields ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Si no seleccionas campos específicos, se exportarán todos los campos disponibles
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              {availableFields.map(field => (
                <div key={field.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={field.value}
                    checked={selectedFields.includes(field.value)}
                    onChange={() => handleFieldToggle(field.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={field.value} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Información de exportación
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Se exportarán hasta 10,000 contactos</li>
              <li>• {exportFormat === 'csv' ? 'El archivo CSV se puede abrir en Excel' : 'El archivo JSON incluye metadatos adicionales'}</li>
              <li>• Los datos se descargarán automáticamente</li>
              {selectedFields.length > 0 && (
                <li>• Se exportarán {selectedFields.length} campos seleccionados</li>
              )}
            </ul>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Exportar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportContactsModal; 