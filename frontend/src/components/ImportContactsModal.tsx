import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { contactImportExportService, ImportResult } from '../services/contactImportExportService';
import { X, Upload, FileText, Download, AlertCircle } from 'lucide-react';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
}

const ImportContactsModal: React.FC<ImportContactsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [importMode, setImportMode] = useState<'csv' | 'json'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(null);
    setValidationError(null);

    try {
      // Validar archivo según tipo
      if (importMode === 'csv') {
        const validation = contactImportExportService.validateCSVFile(selectedFile);
        if (!validation.isValid) {
          setValidationError(validation.error!);
          return;
        }

        // Generar preview del CSV
        const csvText = await contactImportExportService.readCSVFile(selectedFile);
        const previewData = contactImportExportService.parseCSVPreview(csvText, 3);
        setPreview(previewData);
      } else {
        const validation = contactImportExportService.validateJSONFile(selectedFile);
        if (!validation.isValid) {
          setValidationError(validation.error!);
          return;
        }

        // Generar preview del JSON
        const jsonData = await contactImportExportService.readJSONFile(selectedFile);
        if (Array.isArray(jsonData)) {
          setPreview(jsonData.slice(0, 3));
        } else if (jsonData.contacts && Array.isArray(jsonData.contacts)) {
          setPreview(jsonData.contacts.slice(0, 3));
        } else {
          setValidationError('El archivo JSON debe contener un array de contactos');
        }
      }
    } catch (error: any) {
      setValidationError(error.message || 'Error procesando el archivo');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      let result: ImportResult;
      
      if (importMode === 'csv') {
        result = await contactImportExportService.importFromCSV(file);
      } else {
        const jsonData = await contactImportExportService.readJSONFile(file);
        const contacts = Array.isArray(jsonData) ? jsonData : jsonData.contacts;
        result = await contactImportExportService.importFromJSON(contacts);
      }

      onSuccess(result);
      handleClose();
      
      if (result.success) {
        toast.success(`Importación completada: ${result.imported} contactos importados`);
      } else {
        toast.error('Error en la importación');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error importando contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = await contactImportExportService.getCSVTemplate();
      contactImportExportService.downloadBlob(template, 'contacts_template.csv');
    } catch (error: any) {
      toast.error('Error descargando template');
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setValidationError(null);
    setImportMode('csv');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Importar Contactos
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Selector de modo de importación */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato de archivo
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setImportMode('csv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  importMode === 'csv'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <FileText size={16} />
                CSV
              </button>
              <button
                onClick={() => setImportMode('json')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  importMode === 'json'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <FileText size={16} />
                JSON
              </button>
            </div>
          </div>

          {/* Información del formato */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Formato {importMode.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {importMode === 'csv' ? (
                <>
                  El archivo CSV debe contener las columnas: name, number, email, companyName, position, etc.
                  <br />
                  Puedes descargar un template de ejemplo para ver el formato correcto.
                </>
              ) : (
                <>
                  El archivo JSON debe contener un array de objetos con las propiedades: name, number, email, etc.
                  <br />
                  Formato: {`[{ "name": "Juan", "number": "+5491123456789", "email": "juan@example.com" }]`}
                </>
              )}
            </p>
            {importMode === 'csv' && (
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Download size={14} />
                Descargar template CSV
              </button>
            )}
          </div>

          {/* Selector de archivo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar archivo
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-600">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Clic para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {importMode === 'csv' ? 'Archivos CSV (máximo 10MB)' : 'Archivos JSON (máximo 10MB)'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept={importMode === 'csv' ? '.csv' : '.json'}
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          {/* Archivo seleccionado */}
          {file && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-blue-600 dark:text-blue-400" size={16} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              
              {validationError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle size={16} />
                  <span className="text-sm">{validationError}</span>
                </div>
              )}
            </div>
          )}

          {/* Preview de datos */}
          {preview && preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Vista previa (primeros 3 registros)
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="text-left p-2 text-gray-700 dark:text-gray-300">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-600">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-2 text-gray-900 dark:text-white">
                            {String(value).substring(0, 50)}
                            {String(value).length > 50 && '...'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!file || !!validationError || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Importar Contactos
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportContactsModal; 