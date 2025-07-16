import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  fallbackPath?: string;
}

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Cargando..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

const UnauthorizedAccess: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-500 mb-4">
        <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Acceso Denegado
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        No tienes permisos suficientes para acceder a esta página
      </p>
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        )}
        <button
          onClick={() => window.history.back()}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Regresar
        </button>
      </div>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requiredRoles = [],
  fallbackPath = '/login'
}) => {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isRetrying, setIsRetrying] = useState(false);

  // Función para verificar si el usuario tiene el rol requerido
  const hasRequiredRole = (userProfile: string, requiredRoles: string[]): boolean => {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(userProfile);
  };

  // Función para reintentar la autenticación
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Aquí se puede agregar lógica para refrescar el token
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular reintento
      window.location.reload();
    } catch (error) {
      toast.error('Error al reintentar. Intente nuevamente.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Efecto para logging y analytics
  useEffect(() => {
    if (!isLoading) {
      const logData = {
        path: location.pathname,
        requireAuth,
        requiredRoles,
        isAuthenticated,
        userProfile: user?.profile,
        timestamp: new Date().toISOString(),
      };
      
      // Log de acceso a rutas protegidas
      if (requireAuth && isAuthenticated) {
        console.log('✅ Acceso autorizado:', logData);
      } else if (requireAuth && !isAuthenticated) {
        console.log('❌ Acceso denegado - No autenticado:', logData);
      }
    }
  }, [isLoading, isAuthenticated, location.pathname, requireAuth, requiredRoles, user]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || isRetrying) {
    return (
      <LoadingSpinner 
        message={isRetrying ? "Reintentando..." : "Verificando autenticación..."}
      />
    );
  }

  // Si requiere autenticación y no está autenticado, redirigir al login
  if (requireAuth && !isAuthenticated) {
    toast.error('Debes iniciar sesión para acceder a esta página');
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Si no requiere autenticación y está autenticado, redirigir al dashboard
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar roles requeridos
  if (requireAuth && isAuthenticated && user) {
    const userHasPermission = hasRequiredRole(user.profile, requiredRoles);
    
    if (!userHasPermission) {
      toast.error('No tienes permisos suficientes para acceder a esta página');
      return <UnauthorizedAccess onRetry={handleRetry} />;
    }
  }

  // Si llegamos aquí, el usuario está autenticado y tiene los permisos necesarios
  return <>{children}</>;
};

// HOC para rutas que requieren roles específicos
export const RequireRole = (roles: string[]) => (Component: React.ComponentType) => {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute requireAuth={true} requiredRoles={roles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// HOC para rutas de admin únicamente
export const RequireAdmin = RequireRole(['admin']);

// HOC para rutas que requieren admin o manager
export const RequireManager = RequireRole(['admin', 'manager']);

export default ProtectedRoute; 