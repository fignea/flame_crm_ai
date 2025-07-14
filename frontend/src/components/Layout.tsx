import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutInner: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();

  if (!user) {
    return <div>{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="h-full">
          {children}
        </main>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <SidebarProvider>
    <LayoutInner>{children}</LayoutInner>
  </SidebarProvider>
);

export default Layout; 