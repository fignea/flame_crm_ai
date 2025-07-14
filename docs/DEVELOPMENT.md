# Guía de Desarrollo - Flame AI CRM

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose
- Git

### Configuración Inicial
```bash
# Clonar el repositorio
git clone <repository-url>
cd flame_ai

# Ejecutar script de configuración
./scripts/setup.sh

# Iniciar servicios
docker-compose up -d
```

## 📁 Estructura del Proyecto

```
flame_ai/
├── backend/                 # API REST con TypeScript
│   ├── src/
│   │   ├── config/         # Configuraciones
│   │   ├── controllers/    # Controladores de la API
│   │   ├── middleware/     # Middlewares personalizados
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades
│   │   └── types/          # Tipos TypeScript
│   ├── prisma/             # Esquema y migraciones de BD
│   └── uploads/            # Archivos subidos
├── frontend/               # React App con TypeScript
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Servicios de API
│   │   ├── stores/         # Estado global (Zustand)
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Utilidades
│   └── public/             # Archivos estáticos
├── shared/                 # Tipos y utilidades compartidas
└── docs/                   # Documentación
```

## 🛠 Comandos de Desarrollo

### Backend
```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar tests
npm test

# Lint y formateo
npm run lint
npm run format

# Base de datos
npm run db:generate    # Generar cliente Prisma
npm run db:migrate     # Ejecutar migraciones
npm run db:seed        # Cargar datos de prueba
npm run db:studio      # Abrir Prisma Studio
```

### Frontend
```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev

# Compilar para producción
npm run build

# Preview de producción
npm run preview

# Lint y formateo
npm run lint
npm run format

# Verificar tipos
npm run type-check
```

### Docker
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Reconstruir imágenes
docker-compose build --no-cache

# Ejecutar comandos en contenedores
docker-compose exec backend npm run db:migrate
docker-compose exec frontend npm run build
```

## 🎨 Guía de Estilos

### Colores
- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#ec4899` (Pink)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### Componentes
Usar las clases CSS personalizadas definidas en `frontend/src/styles/index.css`:

```tsx
// Botones
<button className="btn-primary">Botón Principal</button>
<button className="btn-secondary">Botón Secundario</button>

// Inputs
<input className="input" placeholder="Escribe algo..." />

// Cards
<div className="card">
  <div className="card-header">Título</div>
  <div className="card-body">Contenido</div>
</div>

// Badges
<span className="badge-success">Éxito</span>
<span className="status-open">Abierto</span>
```

### Iconos
Usar Lucide React para iconos:
```tsx
import { MessageCircle, Phone, Mail } from 'lucide-react';

<MessageCircle className="w-5 h-5" />
```

## 📝 Convenciones de Código

### TypeScript
- Usar tipos estrictos
- Evitar `any`
- Usar interfaces para objetos
- Usar enums para valores constantes

### React
- Usar functional components con hooks
- Usar TypeScript para props
- Seguir las reglas de hooks
- Usar React.memo para optimización

### Naming
- **Archivos**: kebab-case (`user-profile.tsx`)
- **Componentes**: PascalCase (`UserProfile`)
- **Funciones**: camelCase (`getUserData`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

## 🔧 Configuración de IDE

### VS Code Extensions
- TypeScript Importer
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Prisma

### Configuración recomendada
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 🧪 Testing

### Backend
```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Frontend
```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration
```

## 📊 Base de Datos

### Prisma
- Usar Prisma Client para queries
- Escribir migraciones para cambios de esquema
- Usar seeds para datos de prueba

### Ejemplos
```typescript
// Crear usuario
const user = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    password: hashedPassword,
  },
});

// Query con relaciones
const tickets = await prisma.ticket.findMany({
  include: {
    contact: true,
    user: true,
    messages: true,
  },
  where: {
    status: 'open',
  },
});
```

## 🔐 Autenticación

### JWT
- Tokens con expiración de 24 horas
- Refresh tokens para renovación
- Middleware de autenticación en rutas protegidas

### Roles
- `admin`: Acceso completo
- `manager`: Gestión de equipos
- `user`: Usuario estándar

## 📱 WhatsApp Integration

### Baileys
- Sesiones múltiples por empresa
- Webhooks para eventos
- Manejo de archivos multimedia

### Estados de conexión
- `CONNECTED`: Conectado y funcionando
- `CONNECTING`: Intentando conectar
- `DISCONNECTED`: Desconectado

## 🚀 Deployment

### Producción
```bash
# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Desplegar
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de entorno
- Configurar todas las variables en `.env`
- Usar secretos para datos sensibles
- Validar configuración al inicio

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de React Query](https://tanstack.com/query/latest)
- [Documentación de Socket.IO](https://socket.io/docs)
- [Documentación de Baileys](https://github.com/WhiskeySockets/Baileys) 