import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Megaphone,
  Zap,
  Calendar,
  Tag,
  ListTodo,
  User,
  Link2,
  Settings,
  BarChart2,
  FileText,
  HelpCircle,
  LogOut,
  MessageSquare,
  Bot,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Tickets', path: '/tickets', icon: <Ticket size={20} /> },
  { name: 'Contactos', path: '/contacts', icon: <Users size={20} /> },
  { name: 'Conversaciones', path: '/conversations', icon: <MessageSquare size={20} /> },
  { name: 'Campañas', path: '/campaigns', icon: <Megaphone size={20} /> },
  { name: 'Mensajes Rápidos', path: '/quick-messages', icon: <Zap size={20} /> },
  { name: 'Programaciones', path: '/schedules', icon: <Calendar size={20} /> },
  { name: 'Flujos de Bot', path: '/bot-flows', icon: <Bot size={20} /> },
  { name: 'Etiquetas', path: '/tags', icon: <Tag size={20} /> },
  { name: 'Colas', path: '/queues', icon: <ListTodo size={20} /> },
  { name: 'Usuarios', path: '/users', icon: <User size={20} /> },
  { name: 'Conexiones', path: '/connections', icon: <Link2 size={20} /> },
  { name: 'Configuraciones', path: '/settings', icon: <Settings size={20} /> },
  { name: 'Reportes', path: '/reports', icon: <BarChart2 size={20} /> },
  { name: 'Archivos', path: '/files', icon: <FileText size={20} /> },
  { name: 'Ayuda', path: '/help', icon: <HelpCircle size={20} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { } = useTheme();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 z-50 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Flame AI CRM
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email || 'usuario@example.com'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                {user.profile || 'user'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="mt-4 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer with Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {!isCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <LogOut size={20} className="mr-3" />
            Cerrar Sesión
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        )}
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            v2.0.0
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 