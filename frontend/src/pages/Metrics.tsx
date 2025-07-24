import React, { useState } from 'react';
import Layout from '../components/Layout';
import MetricsDashboard from '../components/MetricsDashboard';

const Metrics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'advanced'>('dashboard');

  const ChartIcon = () => (
    <svg className="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartIcon },
    { id: 'advanced', name: 'Métricas Avanzadas', icon: ChartIcon }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="h-8 w-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Métricas y Analíticas
            </h1>
            <p className="text-gray-600 mt-2">
              Visualiza el rendimiento de tu equipo y sistema de conversaciones
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                                 <tab.icon />
                 {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <MetricsDashboard />
            )}
            
            {activeTab === 'advanced' && (
                             <div className="text-center py-12">
                 <svg className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   Métricas Avanzadas
                 </h3>
                 <p className="text-gray-600">
                   Funcionalidad próximamente disponible
                 </p>
               </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Metrics; 