import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertCircle,
  Timer,
  Target,
  UserCheck,
  MessageSquare
} from 'lucide-react';

interface AssignmentMetrics {
  totalConversations: number;
  assignedConversations: number;
  unassignedConversations: number;
  averageAssignmentTime: number;
  assignmentsByAgent: AgentMetrics[];
  assignmentsByMethod: MethodMetrics[];
  responseTimeMetrics: ResponseTimeMetrics;
  workloadDistribution: WorkloadMetrics[];
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalAssigned: number;
  activeConversations: number;
  completedConversations: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  workloadPercentage: number;
  status: 'available' | 'busy' | 'away' | 'offline';
  lastActivity: Date;
}

interface MethodMetrics {
  method: string;
  count: number;
  percentage: number;
  averageSuccessRate: number;
}

interface ResponseTimeMetrics {
  overall: number;
  byHour: { hour: number; avgTime: number }[];
  byDay: { day: string; avgTime: number }[];
  byAgent: { agentId: string; agentName: string; avgTime: number }[];
}

interface WorkloadMetrics {
  agentId: string;
  agentName: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationPercentage: number;
  queuedConversations: number;
}

interface RealTimeMetrics {
  activeAgents: number;
  onlineAgents: number;
  totalConversations: number;
  averageResponseTime: number;
  queueLength: number;
  timestamp: Date;
}

export const AssignmentDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AssignmentMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  useEffect(() => {
    loadMetrics();
    loadRealTimeMetrics();
    
    // Actualizar métricas en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      loadRealTimeMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assignment-metrics');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const response = await fetch('/api/assignment-metrics/real-time');
      const data = await response.json();
      
      if (data.success) {
        setRealTimeMetrics(data.data);
      }
    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'away': return 'text-orange-600 bg-orange-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Ocupado';
      case 'away': return 'Ausente';
      case 'offline': return 'Desconectado';
      default: return 'Desconocido';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics || !realTimeMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Error al cargar las métricas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Asignación</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
          <div className="text-sm text-gray-500">
            Actualizado: {formatDate(realTimeMetrics.timestamp)}
          </div>
        </div>
      </div>

      {/* Métricas en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="Agentes Activos"
          value={realTimeMetrics.activeAgents}
          total={realTimeMetrics.onlineAgents}
          icon={<UserCheck className="h-5 w-5" />}
          color="text-green-600"
        />
        <MetricCard
          title="Conversaciones"
          value={realTimeMetrics.totalConversations}
          icon={<MessageSquare className="h-5 w-5" />}
          color="text-blue-600"
        />
        <MetricCard
          title="Cola de Espera"
          value={realTimeMetrics.queueLength}
          icon={<Timer className="h-5 w-5" />}
          color="text-orange-600"
        />
        <MetricCard
          title="Tiempo Promedio"
          value={formatTime(realTimeMetrics.averageResponseTime)}
          icon={<Clock className="h-5 w-5" />}
          color="text-purple-600"
        />
        <MetricCard
          title="Asignación"
          value={`${Math.round((metrics.assignedConversations / metrics.totalConversations) * 100)}%`}
          icon={<Target className="h-5 w-5" />}
          color="text-indigo-600"
        />
      </div>

      {/* Distribución de carga por agente */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Distribución de Carga por Agente</h3>
        <div className="space-y-4">
          {metrics.assignmentsByAgent.map((agent) => (
            <div key={agent.agentId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">{agent.agentName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agent.status)}`}>
                    {getStatusText(agent.status)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {agent.activeConversations} conversaciones activas
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{agent.totalAssigned}</div>
                  <div className="text-xs text-gray-500">Total Asignadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{agent.completedConversations}</div>
                  <div className="text-xs text-gray-500">Completadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{agent.averageResponseTime}m</div>
                  <div className="text-xs text-gray-500">Tiempo Respuesta</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{agent.workloadPercentage}%</div>
                  <div className="text-xs text-gray-500">Carga Trabajo</div>
                </div>
              </div>
              
              {/* Barra de progreso de carga */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Carga de trabajo</span>
                  <span>{agent.workloadPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      agent.workloadPercentage > 80 ? 'bg-red-500' :
                      agent.workloadPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${agent.workloadPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas por método de asignación */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Métodos de Asignación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.assignmentsByMethod.map((method) => (
            <div key={method.method} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{method.method}</span>
                <span className="text-sm text-gray-500">{method.percentage}%</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">{method.count}</div>
              <div className="text-sm text-gray-500">asignaciones</div>
              <div className="mt-2">
                <div className="flex justify-between text-sm">
                  <span>Tasa de éxito</span>
                  <span className="font-medium">{method.averageSuccessRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="h-1 rounded-full bg-green-500"
                    style={{ width: `${method.averageSuccessRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tiempo de respuesta por agente */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Tiempo de Respuesta por Agente</h3>
        <div className="space-y-3">
          {metrics.responseTimeMetrics.byAgent.map((agent) => (
            <div key={agent.agentId} className="flex items-center justify-between py-2">
              <span className="font-medium">{agent.agentName}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{agent.avgTime} min</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      agent.avgTime > 30 ? 'bg-red-500' :
                      agent.avgTime > 15 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((agent.avgTime / 60) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para métricas
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  total?: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, total, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center">
      <div className={`${color} mr-3`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value}
          {total && <span className="text-sm text-gray-500 ml-1">/ {total}</span>}
        </p>
      </div>
    </div>
  </div>
);

export default AssignmentDashboard; 