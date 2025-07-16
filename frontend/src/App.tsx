import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Contacts from './pages/Contacts';
import Organizations from './pages/Organizations';
import Settings from './pages/Settings';
import Connections from './pages/Connections';
import QuickMessages from './pages/QuickMessages';
import Conversations from './pages/Conversations';
import PlaceholderPage from './pages/PlaceholderPage';
import Tags from './pages/Tags';
import Schedules from './pages/Schedules';
import BotFlows from './pages/BotFlows';
import Users from './pages/Users';
import { Megaphone, ListTodo, BarChart2, FileText, HelpCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            } />
            
            {/* Rutas protegidas */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/tickets" element={
              <ProtectedRoute>
                <Layout>
                  <Tickets />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/contacts" element={
              <ProtectedRoute>
                <Layout>
                  <Contacts />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/organizations" element={
              <ProtectedRoute>
                <Layout>
                  <Organizations />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage 
                    title="Campañas" 
                    description="Gestiona tus campañas de marketing" 
                    icon={<Megaphone size={48} />} 
                  />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/quick-messages" element={
              <ProtectedRoute>
                <Layout>
                  <QuickMessages />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/conversations" element={
              <ProtectedRoute>
                <Layout>
                  <Conversations />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/schedules" element={
              <ProtectedRoute>
                <Layout>
                  <Schedules />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/tags" element={
              <ProtectedRoute>
                <Layout>
                  <Tags />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/bot-flows" element={
              <ProtectedRoute>
                <Layout>
                  <BotFlows />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/queues" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage 
                    title="Colas" 
                    description="Gestiona colas de atención" 
                    icon={<ListTodo size={48} />} 
                  />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/connections" element={
              <ProtectedRoute>
                <Layout>
                  <Connections />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage 
                    title="Reportes" 
                    description="Genera reportes y estadísticas" 
                    icon={<BarChart2 size={48} />} 
                  />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/files" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage 
                    title="Archivos" 
                    description="Gestiona archivos y documentos" 
                    icon={<FileText size={48} />} 
                  />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/help" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage 
                    title="Ayuda" 
                    description="Centro de ayuda y soporte" 
                    icon={<HelpCircle size={48} />} 
                  />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 