import React, { useState, useEffect } from 'react';
import { X, Save, Download, Upload, RotateCcw, Settings, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import whatsappConfigService, { WhatsAppConfig } from '../services/whatsappConfigService';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
  connectionName: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
}

const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  isOpen,
  onClose,
  connectionId,
  connectionName
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar configuración al abrir modal
  useEffect(() => {
    if (isOpen && connectionId) {
      loadConfig();
      loadTemplates();
    }
  }, [isOpen, connectionId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await whatsappConfigService.getConfig(connectionId);
      setConfig(configData);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Error cargando configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // const templatesData = await whatsappConfigService.getConfigTemplates(connectionId); // This line was removed as per the edit hint
    } catch (error: any) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await whatsappConfigService.updateConfig(connectionId, config);
      setHasUnsavedChanges(false);
      toast.success('Configuración guardada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!config) return;

    try {
      const exportData = await whatsappConfigService.exportConfig(connectionId);
      whatsappConfigService.downloadConfig(exportData.config, `whatsapp-config-${connectionName}.json`);
      toast.success('Configuración exportada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error exportando configuración');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedConfig = await whatsappConfigService.readConfigFile(file);
      await whatsappConfigService.importConfig(connectionId, importedConfig);
      await loadConfig();
      toast.success('Configuración importada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error importando configuración');
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que quieres resetear la configuración a los valores por defecto?')) {
      return;
    }

    try {
      const resetConfig = await whatsappConfigService.resetConfig(connectionId);
      setConfig(resetConfig);
      setHasUnsavedChanges(false);
      toast.success('Configuración reseteada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error reseteando configuración');
    }
  };

  const handleConfigChange = (updates: Partial<WhatsAppConfig>) => {
    if (!config) return;
    
    setConfig({ ...config, ...updates });
    setHasUnsavedChanges(true);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Componente de configuración general
  const GeneralConfig: React.FC<{ config: WhatsAppConfig; onChange: (updates: Partial<WhatsAppConfig>) => void }> = ({ config, onChange }) => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Configuración General</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Configura las opciones básicas de funcionamiento de WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-aceptar invitaciones
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoAcceptInvites}
                onChange={(e) => onChange({ autoAcceptInvites: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-eliminar mensajes
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoDeleteMessages}
                onChange={(e) => onChange({ autoDeleteMessages: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {config.autoDeleteMessages && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Eliminar después de (días)
              </label>
              <input
                type="number"
                value={config.autoDeleteAfterDays}
                onChange={(e) => onChange({ autoDeleteAfterDays: parseInt(e.target.value) })}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Logging habilitado
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableLogging}
                onChange={(e) => onChange({ enableLogging: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {config.enableLogging && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel de logging
                </label>
                <select
                  value={config.logLevel}
                  onChange={(e) => onChange({ logLevel: e.target.value as 'info' | 'debug' | 'error' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="error">Error</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retención de logs (días)
                </label>
                <input
                  type="number"
                  value={config.logRetentionDays}
                  onChange={(e) => onChange({ logRetentionDays: parseInt(e.target.value) })}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Componente de configuración de mensajes
  const MessagesConfig: React.FC<{ config: WhatsAppConfig; onChange: (updates: Partial<WhatsAppConfig>) => void }> = ({ config, onChange }) => (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Mensajes Automáticos</h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          Configura mensajes automáticos de bienvenida y ausencia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mensaje de bienvenida
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableWelcomeMessage}
                onChange={(e) => onChange({ enableWelcomeMessage: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {config.enableWelcomeMessage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje de bienvenida
              </label>
              <textarea
                value={config.welcomeMessage}
                onChange={(e) => onChange({ welcomeMessage: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Mensaje que se enviará a nuevos contactos..."
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mensaje de ausencia
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableAwayMessage}
                onChange={(e) => onChange({ enableAwayMessage: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {config.enableAwayMessage && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensaje de ausencia
                </label>
                <textarea
                  value={config.awayMessage}
                  onChange={(e) => onChange({ awayMessage: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Mensaje que se enviará cuando no esté disponible..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retraso del mensaje (minutos)
                </label>
                <input
                  type="number"
                  value={config.awayMessageDelay}
                  onChange={(e) => onChange({ awayMessageDelay: parseInt(e.target.value) })}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const tabs: TabConfig[] = [
    {
      id: 'general',
      label: 'General',
      icon: <Settings className="w-5 h-5" />,
      component: GeneralConfig
    },
    {
      id: 'messages',
      label: 'Mensajes',
      icon: <MessageSquare className="w-5 h-5" />,
      component: MessagesConfig
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Configuración de WhatsApp
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connectionName}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Cambios sin guardar
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">
              <Upload className="w-4 h-4" />
              Importar
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            Resetear
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-750 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : config ? (
                <div>
                  {(() => {
                    const tab = tabs.find(tab => tab.id === activeTab);
                    if (!tab) return null;
                    return React.createElement(tab.component, {
                      config,
                      onChange: handleConfigChange
                    });
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Error cargando configuración
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfigModal; 