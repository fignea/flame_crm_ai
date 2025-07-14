#!/bin/bash

# Flame AI CRM - Script de Configuración Inicial
# Este script configura el entorno de desarrollo

set -e

echo "🚀 Configurando Flame AI CRM..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi
    
    print_success "Docker y Docker Compose están instalados"
}

# Verificar si Node.js está instalado
check_node() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js no está instalado. Se usará Docker para el desarrollo."
        return 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js versión 18+ recomendada. Versión actual: $(node -v)"
        return 1
    fi
    
    print_success "Node.js está instalado: $(node -v)"
    return 0
}

# Crear archivo .env para el backend
create_backend_env() {
    print_status "Creando archivo .env para el backend..."
    
    cat > backend/.env << EOF
# Configuración de la base de datos
DATABASE_URL="postgresql://flame_ai_user:flame_ai_pass@localhost:5432/flame_ai?schema=public"

# Configuración de Redis
REDIS_URL="redis://localhost:6379"

# Configuración de JWT
JWT_SECRET="asdfghjkl1234567890"

# Configuración de la aplicación
NODE_ENV="development"
PORT=8080
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8080"

# Configuración de archivos
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Configuración de WhatsApp
WHATSAPP_SESSION_DIR="./sessions"
WHATSAPP_WEBHOOK_URL=""

# Configuración de email (opcional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

# Configuración de logs
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"
EOF

    print_success "Archivo .env del backend creado"
}

# Crear archivo .env para el frontend
create_frontend_env() {
    print_status "Creando archivo .env para el frontend..."
    
    cat > frontend/.env << EOF
# Configuración de la API
VITE_API_URL="http://localhost:8080"
VITE_APP_NAME="Flame AI CRM"
VITE_APP_VERSION="1.0.0"

# Configuración de WebSocket
VITE_WS_URL="ws://localhost:8080"

# Configuración de la aplicación
VITE_APP_ENV="development"
VITE_APP_DEBUG="true"
EOF

    print_success "Archivo .env del frontend creado"
}

# Instalar dependencias del backend
install_backend_deps() {
    print_status "Instalando dependencias del backend..."
    
    cd backend
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencias del backend instaladas"
    else
        print_error "package.json no encontrado en el backend"
        exit 1
    fi
    
    cd ..
}

# Instalar dependencias del frontend
install_frontend_deps() {
    print_status "Instalando dependencias del frontend..."
    
    cd frontend
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencias del frontend instaladas"
    else
        print_error "package.json no encontrado en el frontend"
        exit 1
    fi
    
    cd ..
}

# Generar cliente Prisma
generate_prisma() {
    print_status "Generando cliente Prisma..."
    
    cd backend
    
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        print_success "Cliente Prisma generado"
    else
        print_error "Schema de Prisma no encontrado"
        exit 1
    fi
    
    cd ..
}

# Crear directorios necesarios
create_directories() {
    print_status "Creando directorios necesarios..."
    
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p backend/sessions
    mkdir -p frontend/public
    
    print_success "Directorios creados"
}

# Configurar Git hooks (opcional)
setup_git_hooks() {
    if [ -d ".git" ]; then
        print_status "Configurando Git hooks..."
        
        mkdir -p .git/hooks
        
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Ejecutando pre-commit hooks..."

# Lint del backend
cd backend
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint del backend falló"
    exit 1
fi

# Lint del frontend
cd ../frontend
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint del frontend falló"
    exit 1
fi

echo "✅ Pre-commit hooks completados"
EOF

        chmod +x .git/hooks/pre-commit
        print_success "Git hooks configurados"
    fi
}

# Función principal
main() {
    echo "🎯 Iniciando configuración de Flame AI CRM..."
    echo ""
    
    # Verificaciones
    check_docker
    NODE_AVAILABLE=$(check_node)
    
    # Crear archivos de configuración
    create_backend_env
    create_frontend_env
    
    # Crear directorios
    create_directories
    
    # Instalar dependencias si Node.js está disponible
    if [ $NODE_AVAILABLE -eq 0 ]; then
        install_backend_deps
        install_frontend_deps
        generate_prisma
    else
        print_warning "Saltando instalación de dependencias (usar Docker)"
    fi
    
    # Configurar Git hooks
    setup_git_hooks
    
    echo ""
    print_success "¡Configuración completada!"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Revisa y ajusta los archivos .env según tu configuración"
    echo "2. Ejecuta 'docker-compose up -d' para iniciar los servicios"
    echo "3. Accede a http://localhost:3000 para ver la aplicación"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "  - docker-compose up -d          # Iniciar servicios"
    echo "  - docker-compose down           # Detener servicios"
    echo "  - docker-compose logs -f        # Ver logs"
    echo "  - docker-compose exec backend npm run db:migrate  # Ejecutar migraciones"
    echo ""
}

# Ejecutar función principal
main "$@" 