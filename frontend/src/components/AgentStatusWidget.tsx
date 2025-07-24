import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Settings, Users, WifiOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import agentStatusService, { AgentStatus, AgentStatusData, StatusOption, TimeoutOption } from '../services/agentStatusService';

interface AgentStatusWidgetProps {
  compact?: boolean;
  showTeamStats?: boolean;
  className?: string;
}

const AgentStatusWidget: React.FC<AgentStatusWidgetProps> = ({
  compact = false,
  showTeamStats = true,
  className = ''
}) => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [myStatus, setMyStatus] = useState<AgentStatusData | null>(null);
  const [teamStatuses, setTeamStatuses] = useState<AgentStatusData[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [timeoutOptions, setTimeoutOptions] = useState<TimeoutOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    autoAwayEnabled: true,
    autoAwayTimeout: 15
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Configurar listeners de socket
  useEffect(() => {
    if (socket) {
      // Iniciar seguimiento de actividad
      agentStatusService.startActivityTracking(socket);

      // Listener para cambios de estado
      const handleStatusChange = (data: any) => {
        if (data.userId === myStatus?.userId) {
          // Actualizar mi estado
          loadMyStatus();
        } else {
          // Actualizar estado del equipo
          loadTeamStatuses();
        }
      };

      socket.on('agentStatusChanged', handleStatusChange);

      return () => {
        socket.off('agentStatusChanged', handleStatusChange);
        agentStatusService.stopActivityTracking();
      };
    }
  }, [socket, myStatus?.userId]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [myStatusData, teamData, options] = await Promise.all([
        agentStatusService.getMyStatus(),
        showTeamStats ? agentStatusService.getCompanyStatuses() : Promise.resolve([]),
        agentStatusService.getOptions()
      ]);

      setMyStatus(myStatusData);
      setTeamStatuses(teamData);
      setStatusOptions(options.statusOptions);
      setTimeoutOptions(options.timeoutOptions);
      setTempSettings({
        autoAwayEnabled: myStatusData.autoAwayEnabled,
        autoAwayTimeout: myStatusData.autoAwayTimeout
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error cargando estado del agente');
    } finally {
      setLoading(false);
    }
  };

  const loadMyStatus = async () => {
    try {
      const statusData = await agentStatusService.getMyStatus();
      setMyStatus(statusData);
    } catch (error) {
      console.error('Error loading my status:', error);
    }
  };

  const loadTeamStatuses = async () => {
    if (!showTeamStats) return;
    
    try {
      const teamData = await agentStatusService.getCompanyStatuses();
      setTeamStatuses(teamData);
    } catch (error) {
      console.error('Error loading team statuses:', error);
    }
  };

  const handleStatusChange = async (newStatus: AgentStatus) => {
    if (!myStatus) return;

    try {
      setLoading(true);
      const updatedStatus = await agentStatusService.setStatus(newStatus);
      setMyStatus(updatedStatus);
      setIsOpen(false);
      toast.success(`Estado cambiado a ${agentStatusService.getStatusLabel(newStatus)}`);
    } catch (error: any) {
      toast.error(error.message || 'Error cambiando estado');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async () => {
    if (!myStatus) return;

    try {
      setLoading(true);
      const updatedStatus = await agentStatusService.updateStatus({
        autoAwayEnabled: tempSettings.autoAwayEnabled,
        autoAwayTimeout: tempSettings.autoAwayTimeout
      });
      setMyStatus(updatedStatus);
      setShowSettings(false);
      toast.success('Configuración actualizada');
    } catch (error: any) {
      toast.error(error.message || 'Error actualizando configuración');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: AgentStatus, isOnline: boolean = true) => {
    const color = agentStatusService.getStatusColor(status);
    const label = agentStatusService.getStatusLabel(status);
    
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          {isOnline && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
          )}
        </div>
        {!compact && <span className="text-sm font-medium">{label}</span>}
      </div>
    );
  };

  const getTeamStats = () => {
    const stats = {
      available: teamStatuses.filter(s => s.agentStatus === AgentStatus.AVAILABLE && s.isOnline).length,
      busy: teamStatuses.filter(s => s.agentStatus === AgentStatus.BUSY && s.isOnline).length,
      away: teamStatuses.filter(s => s.agentStatus === AgentStatus.AWAY && s.isOnline).length,
      offline: teamStatuses.filter(s => s.agentStatus === AgentStatus.OFFLINE || !s.isOnline).length,
      total: teamStatuses.length
    };
    return stats;
  };

  if (loading && !myStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    );
  }

  if (!myStatus) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Error de conexión</span>
      </div>
    );
  }

  const teamStats = getTeamStats();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        disabled={loading}
      >
        {renderStatusBadge(myStatus.agentStatus, myStatus.isOnline)}
        {!compact && <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estado del Agente
              </h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {myStatus.user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Última actividad: {agentStatusService.formatRelativeTime(myStatus.lastSeen)}
              </p>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Configuraciones
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Auto-ausente
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.autoAwayEnabled}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        autoAwayEnabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {tempSettings.autoAwayEnabled && (
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Tiempo de inactividad
                    </label>
                    <select
                      value={tempSettings.autoAwayTimeout}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        autoAwayTimeout: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {timeoutOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSettingsChange}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Options */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Cambiar Estado
            </h4>
            <div className="space-y-2">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={loading || option.value === myStatus.agentStatus}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    option.value === myStatus.agentStatus
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-sm">{option.label}</span>
                  {option.value === myStatus.agentStatus && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Team Stats */}
          {showTeamStats && teamStatuses.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Estado del Equipo
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Disponible: {teamStats.available}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Ocupado: {teamStats.busy}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Ausente: {teamStats.away}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Offline: {teamStats.offline}
                  </span>
                </div>
              </div>
              
              {/* Online Team Members */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agentes Online ({teamStats.total - teamStats.offline})
                </h5>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {teamStatuses
                    .filter(status => status.isOnline && status.userId !== myStatus.userId)
                    .sort((a, b) => agentStatusService.getStatusPriority(a.agentStatus) - agentStatusService.getStatusPriority(b.agentStatus))
                    .map(status => (
                      <div key={status.userId} className="flex items-center gap-2 px-2 py-1 rounded">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: agentStatusService.getStatusColor(status.agentStatus) }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {status.user.name}
                        </span>
                        {status.statusMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            - {status.statusMessage}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentStatusWidget; 