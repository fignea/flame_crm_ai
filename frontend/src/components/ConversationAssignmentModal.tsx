import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, AlertCircle, Clock, CheckCircle, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import conversationAssignmentService, { AgentStatus } from '../services/conversationAssignmentService';

interface ConversationAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentAgentId?: string;
  currentAgentName?: string;
  contactName: string;
  mode: 'assign' | 'transfer';
}

const ConversationAssignmentModal: React.FC<ConversationAssignmentModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  currentAgentId,
  currentAgentName,
  contactName,
  mode
}) => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const availableAgents = await conversationAssignmentService.getAvailableAgents();
      // Filtrar el agente actual si es transferencia
      const filteredAgents = mode === 'transfer' 
        ? availableAgents.filter(agent => agent.id !== currentAgentId)
        : availableAgents;
      
      setAgents(filteredAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Error al cargar los agentes');
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      await conversationAssignmentService.assignConversationAutomatically(conversationId);
      toast.success('Conversación asignada automáticamente');
      onClose();
    } catch (error: any) {
      console.error('Error in auto assignment:', error);
      toast.error(error.message || 'Error en la asignación automática');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedAgentId) {
      toast.error('Por favor selecciona un agente');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'assign') {
        await conversationAssignmentService.assignConversationToAgent(conversationId, selectedAgentId);
        toast.success('Conversación asignada exitosamente');
      } else {
        await conversationAssignmentService.transferConversation(
          conversationId,
          selectedAgentId,
          transferReason
        );
        toast.success('Conversación transferida exitosamente');
      }
      onClose();
    } catch (error: any) {
      console.error('Error in manual assignment:', error);
      toast.error(error.message || 'Error procesando la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    setLoading(true);
    try {
      await conversationAssignmentService.releaseConversation(conversationId);
      toast.success('Conversación liberada exitosamente');
      onClose();
    } catch (error: any) {
      console.error('Error releasing conversation:', error);
      toast.error(error.message || 'Error liberando la conversación');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-orange-600 bg-orange-100';
      case 'away':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'busy':
        return <AlertCircle className="w-4 h-4" />;
      case 'away':
        return <Clock className="w-4 h-4" />;
      case 'offline':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: AgentStatus['status']) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Ocupado';
      case 'away':
        return 'Ausente';
      case 'offline':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === 'assign' ? 'Asignar Conversación' : 'Transferir Conversación'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conversación con {contactName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {mode === 'transfer' && currentAgentName && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Agente actual:</strong> {currentAgentName}
            </p>
          </div>
        )}

        {mode === 'assign' && (
          <div className="mb-4">
            <button
              onClick={handleAutoAssign}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Asignación Automática
            </button>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Asignar al agente disponible con menos carga
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            {mode === 'assign' ? 'Asignación Manual' : 'Seleccionar Agente'}
          </h3>

          {loadingAgents ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAgentId === agent.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {agent.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {agent.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(agent.status)}`}>
                        {getStatusIcon(agent.status)}
                        {getStatusText(agent.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {agent.activeConversations}/{agent.maxConversations}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {agents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay agentes disponibles
                </div>
              )}
            </div>
          )}
        </div>

        {mode === 'transfer' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo de transferencia (opcional)
            </label>
            <textarea
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Especifica el motivo de la transferencia..."
            />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {mode === 'transfer' && currentAgentId && (
            <button
              onClick={handleRelease}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Liberando...' : 'Liberar Conversación'}
            </button>
          )}
          
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleManualAssign}
            disabled={loading || !selectedAgentId}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : mode === 'assign' ? 'Asignar' : 'Transferir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationAssignmentModal; 