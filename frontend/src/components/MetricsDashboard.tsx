import React, { useState, useEffect } from 'react';
// SVG Icons como componentes
const ChartBarIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ClockIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChatBubbleLeftRightIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V8a2 2 0 012-2h2" />
  </svg>
);

const UserGroupIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const ArrowTrendingUpIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ArrowTrendingDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const InformationCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
import MetricsService, { DashboardMetrics, RealTimeMetrics, MetricsFilters } from '../services/metricsService';

interface MetricsDashboardProps {
  className?: string;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [alerts, setAlerts] = useState<any[]>([]);

  const periods = [
    { value: 'hour', label: 'Última hora' },
    { value: 'day', label: 'Último día' },
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mes' }
  ];

  useEffect(() => {
    loadMetrics();
    loadRealTimeMetrics();
    loadAlerts();

    // Actualizar métricas en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      loadRealTimeMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = getFiltersForPeriod(selectedPeriod);
      const data = await MetricsService.getDashboardMetrics(filters);
      setMetrics(data);
    } catch (err: any) {
      console.error('Error loading metrics:', err);
      setError(err.message || 'Error al cargar las métricas');
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const data = await MetricsService.getRealTimeMetrics();
      setRealTimeMetrics(data);
    } catch (err) {
      console.error('Error loading real-time metrics:', err);
    }
  };

  const loadAlerts = async () => {
    try {
      const alertsData = await MetricsService.getMetricsAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error loading alerts:', err);
    }
  };

  const getFiltersForPeriod = (period: string): MetricsFilters => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  };

  const exportMetrics = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const filters = getFiltersForPeriod(selectedPeriod);
      const blob = await MetricsService.exportMetrics('performance', format, filters);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metricas-${selectedPeriod}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting metrics:', err);
      alert('Error al exportar métricas');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        No hay métricas disponibles
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Métricas</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => exportMetrics('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => exportMetrics('json')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Exportar JSON
          </button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Alertas del Sistema</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  alert.level === 'error' 
                    ? 'bg-red-100 text-red-800' 
                    : alert.level === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <strong>{alert.message}</strong> - {alert.value} (umbral: {alert.threshold})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métricas en tiempo real */}
      {realTimeMetrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
            <h3 className="text-sm font-medium text-blue-800">Métricas en Tiempo Real</h3>
            <span className="text-xs text-blue-600 ml-auto">
              Última actualización: {new Date(realTimeMetrics.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Conversaciones Activas:</span>
              <span className="ml-2 font-medium">{realTimeMetrics.activeConversations}</span>
            </div>
            <div>
              <span className="text-blue-600">Mensajes Recientes:</span>
              <span className="ml-2 font-medium">{realTimeMetrics.recentMessages}</span>
            </div>
            <div>
              <span className="text-blue-600">Agentes Activos:</span>
              <span className="ml-2 font-medium">{realTimeMetrics.activeAgents}</span>
            </div>
            <div>
              <span className="text-blue-600">Tiempo de Respuesta:</span>
              <span className="ml-2 font-medium">
                {MetricsService.formatTime(realTimeMetrics.avgResponseTime)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Resumen ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Conversaciones</div>
              <div className="text-2xl font-bold text-gray-900">
                {MetricsService.formatNumber(metrics.summary.totalConversations)}
              </div>
              <div className="text-sm text-gray-500">
                {metrics.summary.activeConversations} activas
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Tiempo de Respuesta</div>
              <div className="text-2xl font-bold text-gray-900">
                {MetricsService.formatTime(metrics.summary.avgResponseTime)}
              </div>
              <div className="text-sm text-gray-500">
                {MetricsService.formatPercentage(metrics.responseTime.slaCompliance)} SLA
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Mensajes</div>
              <div className="text-2xl font-bold text-gray-900">
                {MetricsService.formatNumber(metrics.summary.totalMessages)}
              </div>
              <div className="text-sm text-gray-500">
                {metrics.messages.incoming} entrantes
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Agentes</div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.summary.activeAgents}
              </div>
              <div className="text-sm text-gray-500">
                de {metrics.agents.total} total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversaciones por hora */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Conversaciones por Hora</h3>
          <div className="h-64">
            <SimpleBarChart
              data={metrics.conversations.byHour}
              dataKey="count"
              xKey="hour"
              color="#3B82F6"
            />
          </div>
        </div>

        {/* Mensajes por hora */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Mensajes por Hora</h3>
          <div className="h-64">
            <SimpleBarChart
              data={metrics.messages.byHour}
              dataKey="count"
              xKey="hour"
              color="#10B981"
            />
          </div>
        </div>
      </div>

      {/* Top performers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mejores Agentes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversaciones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo de Respuesta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensajes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntuación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.agents.topPerformers.map((agent, index) => (
                <tr key={agent.agentId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {agent.agentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                        <div className="text-sm text-gray-500">{agent.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.totalConversations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {MetricsService.formatTime(agent.avgResponseTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.totalMessages}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(agent.productivityScore)}
                      </div>
                      <div className="ml-2">
                        {index === 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salud del sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salud del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500">Tiempo de Respuesta del Servidor</div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.systemHealth.avgServerResponseTime}ms
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Tasa de Error</div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.systemHealth.errorRate}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Uptime</div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.systemHealth.uptime}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Conexiones Activas</div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.systemHealth.activeConnections}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente simple para gráfico de barras
const SimpleBarChart: React.FC<{
  data: any[];
  dataKey: string;
  xKey: string;
  color: string;
}> = ({ data, dataKey, xKey, color }) => {
  const maxValue = Math.max(...data.map(item => item[dataKey]));

  return (
    <div className="flex items-end h-full space-x-1">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded-t"
            style={{
              height: `${(item[dataKey] / maxValue) * 100}%`,
              backgroundColor: color,
              minHeight: '2px'
            }}
          />
          <div className="text-xs text-gray-500 mt-1">
            {typeof item[xKey] === 'number' ? `${item[xKey]}:00` : item[xKey]}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsDashboard; 