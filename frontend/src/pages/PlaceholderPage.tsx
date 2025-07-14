import React from 'react';


interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon }) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title} - Próximamente
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Esta funcionalidad está en desarrollo y estará disponible pronto. 
          Mientras tanto, puedes explorar otras secciones del sistema.
        </p>
        <div className="flex justify-center space-x-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Ir al Dashboard
          </button>
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
            Ver Tickets
          </button>
        </div>
      </div>
    </div>
  );
};

// Ejemplo de uso:
// <PlaceholderPage title="Campañas" description="Gestiona tus campañas de marketing" icon={<Megaphone size={48} />} />
// <PlaceholderPage title="Mensajes Rápidos" description="Configura respuestas automáticas" icon={<Zap size={48} />} />
// ...

export default PlaceholderPage; 