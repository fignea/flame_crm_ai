# Flame AI CRM - Frontend

Frontend moderno para el sistema de gestión de chat multi-plataforma, construido con React, TypeScript, Vite y Tailwind CSS.

## 🚀 Características

- **Dashboard Interactivo**: Gráficos en tiempo real con métricas de WhatsApp, Instagram y Facebook
- **Vista Kanban**: Gestión visual de tickets con drag & drop
- **Autenticación Segura**: Sistema de login/logout con protección de rutas
- **Diseño Responsivo**: Interfaz moderna que se adapta a todos los dispositivos
- **Tema Oscuro/Claro**: Soporte para ambos temas
- **Conexión en Tiempo Real**: WebSocket para actualizaciones instantáneas

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **React Router** - Navegación
- **React Query** - Gestión de estado del servidor
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos modernos
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificaciones

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env.example .env

# Configurar variables de entorno
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🔗 Conexión con Backend

El frontend se conecta al backend a través de:

### API REST
- **Base URL**: `http://localhost:8080`
- **Autenticación**: JWT Bearer Token
- **Interceptores**: Manejo automático de tokens y errores

### WebSocket
- **URL**: `ws://localhost:8080`
- **Eventos**: Actualizaciones en tiempo real de tickets y mensajes

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout principal con sidebar
│   ├── Sidebar.tsx     # Menú lateral
│   └── ProtectedRoute.tsx # Protección de rutas
├── contexts/           # Contextos de React
│   ├── AuthContext.tsx # Autenticación
│   ├── SocketContext.tsx # WebSocket
│   └── ThemeContext.tsx # Tema
├── pages/              # Páginas de la aplicación
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Tickets.tsx     # Gestión de tickets
│   ├── Contacts.tsx    # Gestión de contactos
│   ├── Settings.tsx    # Configuraciones
│   └── Login.tsx       # Página de login
├── services/           # Servicios de API
│   ├── api.ts          # Configuración base de axios
│   ├── authService.ts  # Autenticación
│   ├── ticketService.ts # Tickets
│   ├── whatsappService.ts # WhatsApp
│   └── dashboardService.ts # Dashboard
├── types/              # Tipos TypeScript
│   └── api.ts          # Tipos de la API
└── styles/             # Estilos globales
    └── globals.css     # Estilos base
```

## 🔐 Autenticación

### Flujo de Login
1. Usuario ingresa credenciales
2. Frontend envía POST a `/auth/login`
3. Backend valida y retorna JWT token
4. Token se almacena en localStorage
5. Usuario es redirigido al dashboard

### Protección de Rutas
- Todas las rutas excepto `/login` requieren autenticación
- `ProtectedRoute` verifica el token automáticamente
- Redirección automática a login si no está autenticado

## 📊 Dashboard

### Métricas en Tiempo Real
- **Mensajes Hoy**: Total de mensajes recibidos
- **Tickets Resueltos**: Tickets cerrados exitosamente
- **Tiempo Promedio**: Tiempo de respuesta promedio
- **Agentes Activos**: Usuarios conectados

### Gráficos
- **Mensajes por Plataforma**: Distribución diaria
- **Distribución por Plataforma**: Gráfico de pastel
- **Tiempo de Respuesta**: Evolución en 24h
- **Rendimiento de Agentes**: Comparativa de productividad

### Estado de Plataformas
- **WhatsApp**: Estado de conexión y métricas
- **Instagram**: Estado de conexión y métricas
- **Facebook**: Estado de conexión y métricas

## 🎫 Sistema de Tickets

### Vista Kanban
- **Columnas**: Pendientes, Abiertos, En Espera, Cerrados
- **Drag & Drop**: Mover tickets entre estados
- **Filtros**: Por estado, prioridad, agente
- **Búsqueda**: Búsqueda en tiempo real

### Funcionalidades
- Crear nuevo ticket
- Asignar a agente
- Cambiar prioridad
- Agregar etiquetas
- Historial de mensajes

## 🔧 Configuración

### Variables de Entorno
```env
# API Configuration
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080

# App Configuration
VITE_APP_NAME=Flame AI CRM
VITE_APP_VERSION=2.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=false
```

### Personalización
- **Tema**: Modificar `ThemeContext.tsx`
- **Colores**: Editar `tailwind.config.js`
- **Rutas**: Configurar en `App.tsx`
- **API**: Ajustar en `services/api.ts`

## 🚀 Despliegue

### Build de Producción
```bash
npm run build
```

### Docker
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 Debugging

### Herramientas de Desarrollo
- **React DevTools**: Inspeccionar componentes
- **Redux DevTools**: Monitorear estado (si se usa)
- **Network Tab**: Verificar llamadas a API
- **Console**: Logs y errores

### Logs
- Errores de autenticación
- Fallos de conexión WebSocket
- Errores de API
- Problemas de renderizado

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico:
- 📧 Email: support@flameai.com
- 📖 Documentación: [docs.flameai.com](https://docs.flameai.com)
- 🐛 Issues: [GitHub Issues](https://github.com/flameai/crm/issues) 