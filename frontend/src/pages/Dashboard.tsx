import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Users,
  Smartphone,
  Instagram,
  Facebook,
  Activity,
  Zap,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Queries para obtener datos del dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  const { data: chartData, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: dashboardService.getChartData,
    refetchInterval: 60000, // Refrescar cada minuto
  });

  const { data: platformStats, isLoading: platformsLoading } = useQuery({
    queryKey: ['dashboard-platforms'],
    queryFn: dashboardService.getPlatformStats,
    refetchInterval: 15000, // Refrescar cada 15 segundos
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardService.getRecentActivity,
    refetchInterval: 10000, // Refrescar cada 10 segundos
  });

  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: dashboardService.getAlerts,
    refetchInterval: 20000, // Refrescar cada 20 segundos
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            No autorizado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Por favor inicia sesión para continuar
          </p>
        </div>
      </div>
    );
  }

  const isLoading = statsLoading || chartsLoading || platformsLoading;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Panel de control - Gestión multi-plataforma de chat
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <MessageSquare className="text-white" size={20} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Mensajes Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.totalMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <CheckCircle className="text-white" size={20} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Resueltos Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.resolvedTickets}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <Clock className="text-white" size={20} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Tiempo Promedio
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.averageResponseTime ? stats.averageResponseTime.toFixed(1) : '0.0'}m
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <Users className="text-white" size={20} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Agentes Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.activeAgents}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Status */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Smartphone className="text-green-500 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">WhatsApp</h3>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${platformStats.whatsapp.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${platformStats.whatsapp.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {platformStats.whatsapp.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mensajes hoy:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{platformStats.whatsapp.messagesToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo respuesta:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{platformStats.whatsapp.responseTime ? platformStats.whatsapp.responseTime.toFixed(1) : '0.0'}m</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Instagram className="text-pink-500 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Instagram</h3>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${platformStats.instagram.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${platformStats.instagram.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {platformStats.instagram.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mensajes hoy:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{platformStats.instagram.messagesToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo respuesta:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{platformStats.instagram.responseTime ? platformStats.instagram.responseTime.toFixed(1) : '0.0'}m</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Facebook className="text-blue-500 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Facebook</h3>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${platformStats.facebook.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${platformStats.facebook.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {platformStats.facebook.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mensajes hoy:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{platformStats.facebook.messagesToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo respuesta:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{platformStats.facebook.responseTime ? platformStats.facebook.responseTime.toFixed(1) : '0.0'}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mensajes por día */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mensajes por Plataforma (Última Semana)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyMessages || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="WhatsApp" fill="#25D366" />
                <Bar dataKey="Instagram" fill="#E4405F" />
                <Bar dataKey="Facebook" fill="#1877F2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por plataforma */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribución por Plataforma
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.platformDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(chartData.platformDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Row 2 */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tiempo de respuesta */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tiempo de Respuesta Promedio (24h)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.responseTimeData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="avgTime" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Rendimiento de agentes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rendimiento de Agentes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.agentPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" fill="#8884d8" />
                <Bar dataKey="resolved" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Activity className="text-white" size={16} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alertas y Notificaciones
          </h3>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                alert.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex-shrink-0">
                  <AlertCircle className={`w-5 h-5 ${
                    alert.type === 'error' ? 'text-red-500' :
                    alert.type === 'warning' ? 'text-yellow-500' :
                    alert.type === 'success' ? 'text-green-500' :
                    'text-blue-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <MessageSquare className="text-blue-600 dark:text-blue-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Nuevo Ticket</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <Zap className="text-green-600 dark:text-green-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Mensaje Rápido</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <Calendar className="text-purple-600 dark:text-purple-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Programar</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
            <Activity className="text-orange-600 dark:text-orange-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Reportes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 