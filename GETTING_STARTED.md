# 🚀 Guía de Inicio Rápido - Flame AI CRM

## ¡Bienvenido a Flame AI CRM!

Has creado exitosamente un proyecto moderno y optimizado para gestión de WhatsApp con CRM integrado. Esta guía te ayudará a comenzar rápidamente.

## 📋 Prerrequisitos

- ✅ Docker y Docker Compose instalados
- ✅ Git instalado
- ✅ Node.js 18+ (opcional, para desarrollo local)

## 🎯 Inicio Rápido

### 1. Configuración Inicial
```bash
# El script de configuración ya se ejecutó automáticamente
# Creó los archivos .env y directorios necesarios
```

### 2. Iniciar Servicios
```bash
# Iniciar todos los servicios con Docker
docker-compose up -d

# Verificar que todos los servicios estén corriendo
docker-compose ps
```

### 3. Configurar Base de Datos
```bash
# Ejecutar migraciones
docker-compose exec backend npm run db:migrate

# Cargar datos iniciales
docker-compose exec backend npm run db:seed
```

### 4. Acceder a la Aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Credenciales**: 
  - Email: `admin@flameai.com`
  - Contraseña: `admin123`

## 🎨 Características Principales

### ✨ Frontend Moderno
- **React 18** con TypeScript
- **Tailwind CSS** con colores llamativos
- **Vite** para desarrollo rápido
- **React Query** para gestión de estado
- **Socket.IO** para tiempo real
- **Framer Motion** para animaciones

### 🔧 Backend Optimizado
- **Node.js 18** con TypeScript
- **Express.js** con middleware de seguridad
- **Prisma ORM** para base de datos
- **Baileys** para WhatsApp
- **Redis** para caché y colas
- **Socket.IO** para WebSockets

### 📊 Base de Datos
- **PostgreSQL** como base principal
- **Esquema optimizado** con relaciones
- **Migraciones automáticas**
- **Seeds para datos de prueba**

## 🎯 Próximos Pasos

### 1. Explorar la Estructura
```
flame_ai/
├── backend/           # API REST
├── frontend/          # React App
├── shared/            # Tipos compartidos
├── docs/              # Documentación
└── scripts/           # Scripts de utilidad
```

### 2. Personalizar Configuración
- Revisar archivos `.env` en `backend/` y `frontend/`
- Ajustar variables según tu entorno
- Configurar credenciales de WhatsApp

### 3. Desarrollo Local (Opcional)
```bash
# Instalar dependencias del backend
cd backend && npm install

# Instalar dependencias del frontend
cd frontend && npm install

# Ejecutar en modo desarrollo
npm run dev  # En ambos directorios
```

### 4. Conectar WhatsApp
1. Acceder a la aplicación
2. Ir a Configuración > WhatsApp
3. Crear nueva conexión
4. Escanear código QR
5. ¡Listo para usar!

## 🛠 Comandos Útiles

### Docker
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Reconstruir imágenes
docker-compose build --no-cache

# Detener servicios
docker-compose down

# Ejecutar comandos en contenedores
docker-compose exec backend npm run db:migrate
docker-compose exec frontend npm run build
```

### Desarrollo
```bash
# Backend
npm run dev          # Desarrollo
npm run build        # Compilar
npm run test         # Tests
npm run lint         # Lint

# Frontend
npm run dev          # Desarrollo
npm run build        # Compilar
npm run preview      # Preview
npm run lint         # Lint
```

## 🎨 Personalización

### Colores
Los colores están definidos en `frontend/tailwind.config.js`:
- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#ec4899` (Pink)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### Componentes
Usar las clases CSS personalizadas:
```tsx
<button className="btn-primary">Botón Principal</button>
<input className="input" placeholder="Escribe algo..." />
<div className="card">Contenido</div>
<span className="badge-success">Éxito</span>
```

## 🔐 Seguridad

### Variables de Entorno
- Cambiar `JWT_SECRET` en producción
- Configurar `DATABASE_URL` correctamente
- Ajustar `FRONTEND_URL` y `BACKEND_URL`

### HTTPS en Producción
- Configurar certificados SSL
- Usar `docker-compose.prod.yml`
- Habilitar headers de seguridad

## 📱 Funcionalidades

### WhatsApp
- ✅ Conexión múltiple
- ✅ Mensajes multimedia
- ✅ Webhooks
- ✅ Estados de conexión

### CRM
- ✅ Gestión de contactos
- ✅ Historial de conversaciones
- ✅ Etiquetas y categorías
- ✅ Información de empresa

### Kanban
- ✅ Tablero visual
- ✅ Drag & drop
- ✅ Estados personalizables
- ✅ Filtros y búsqueda

### Automatización
- ✅ Triggers por palabras clave
- ✅ Respuestas automáticas
- ✅ Campañas masivas
- ✅ Agendamiento

## 🚀 Deployment

### Producción
```bash
# Construir para producción
docker-compose -f docker-compose.prod.yml build

# Desplegar
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Producción
- Configurar todas las variables en `.env`
- Usar secretos para datos sensibles
- Configurar backup de base de datos

## 📚 Recursos

- [Guía de Desarrollo](./docs/DEVELOPMENT.md)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de React Query](https://tanstack.com/query/latest)

## 🆘 Soporte

Si encuentras algún problema:

1. Revisar logs: `docker-compose logs -f`
2. Verificar configuración en archivos `.env`
3. Consultar la [Guía de Desarrollo](./docs/DEVELOPMENT.md)
4. Crear un issue en el repositorio

---

## 🎉 ¡Felicitaciones!

Has configurado exitosamente Flame AI CRM. Ahora puedes:

- ✅ Gestionar conversaciones de WhatsApp
- ✅ Organizar contactos como CRM
- ✅ Usar el sistema Kanban
- ✅ Automatizar respuestas
- ✅ Personalizar la interfaz

¡Disfruta usando tu nueva plataforma de gestión de WhatsApp! 🚀 