#!/bin/bash

# Flame AI CRM - Script de Reconstrucción Completa
# Este script reconstruye todo el proyecto desde cero

set -e

echo "🔥 Iniciando reconstrucción completa de Flame AI CRM..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependencias
check_dependencies() {
    print_header "Verificando dependencias..."
    
    if ! command_exists docker; then
        print_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi
    
    print_success "Docker y Docker Compose están instalados"
}

# Detener y limpiar todo
cleanup_everything() {
    print_header "Limpiando todo el entorno..."
    
    print_status "Deteniendo contenedores..."
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    
    print_status "Eliminando contenedores huérfanos..."
    docker container prune -f 2>/dev/null || true
    
    print_status "Eliminando volúmenes no utilizados..."
    docker volume prune -f 2>/dev/null || true
    
    print_status "Eliminando redes no utilizadas..."
    docker network prune -f 2>/dev/null || true
    
    print_status "Limpiando caché de Docker..."
    docker system prune -f 2>/dev/null || true
    
    print_status "Eliminando imágenes no utilizadas..."
    docker image prune -a -f 2>/dev/null || true
    
    print_success "Limpieza completada"
}

# Limpiar directorios locales
clean_local_dirs() {
    print_header "Limpiando directorios locales..."
    
    print_status "Eliminando node_modules..."
    rm -rf backend/node_modules 2>/dev/null || true
    rm -rf frontend/node_modules 2>/dev/null || true
    
    print_status "Eliminando archivos de build..."
    rm -rf backend/dist 2>/dev/null || true
    rm -rf frontend/dist 2>/dev/null || true
    rm -rf frontend/build 2>/dev/null || true
    
    print_status "Eliminando archivos de caché..."
    rm -rf backend/.prisma 2>/dev/null || true
    rm -rf frontend/.vite 2>/dev/null || true
    
    print_status "Eliminando logs..."
    rm -rf backend/logs/* 2>/dev/null || true
    
    print_status "Eliminando sesiones..."
    rm -rf backend/sessions/* 2>/dev/null || true
    
    print_status "Eliminando uploads..."
    rm -rf backend/uploads/* 2>/dev/null || true
    
    print_success "Directorios locales limpiados"
}

# Crear archivos de configuración
create_env_files() {
    print_header "Creando archivos de configuración..."
    
    # Backend .env
    print_status "Creando backend/.env..."
    cat > backend/.env << EOF
# Configuración de la base de datos
DATABASE_URL="postgresql://flame_ai_user:flame_ai_pass@localhost:5432/flame_ai?schema=public"

# Configuración de Redis
REDIS_URL="redis://localhost:6379"

# Configuración de JWT
JWT_SECRET="flame-ai-super-secret-key-2024"

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

    # Frontend .env
    print_status "Creando frontend/.env..."
    cat > frontend/.env << EOF
# Configuración de la API
VITE_API_URL="http://localhost:8080/api"
VITE_BACKEND_URL="http://localhost:8080"
VITE_APP_NAME="Flame AI CRM"
VITE_APP_VERSION="1.0.0"

# Configuración de WebSocket
VITE_WS_URL="ws://localhost:8080"

# Configuración de la aplicación
VITE_APP_ENV="development"
VITE_APP_DEBUG="true"
EOF

    print_success "Archivos de configuración creados"
}

# Crear directorios necesarios
create_directories() {
    print_header "Creando directorios necesarios..."
    
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p backend/sessions
    mkdir -p frontend/public
    mkdir -p shared/types
    
    print_success "Directorios creados"
}

# Reconstruir imágenes Docker
rebuild_docker_images() {
    print_header "Reconstruyendo imágenes Docker..."
    
    print_status "Reconstruyendo imagen del backend..."
    docker-compose build --no-cache backend
    
    print_status "Reconstruyendo imagen del frontend..."
    docker-compose build --no-cache frontend
    
    print_success "Imágenes Docker reconstruidas"
}

# Iniciar servicios base
start_base_services() {
    print_header "Iniciando servicios base..."
    
    print_status "Iniciando PostgreSQL y Redis..."
    docker-compose up -d postgres redis
    
    print_status "Esperando que PostgreSQL esté listo..."
    sleep 10
    
    # Verificar que PostgreSQL esté funcionando
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U flame_ai_user -d flame_ai >/dev/null 2>&1; then
            print_success "PostgreSQL está listo"
            break
        fi
        print_status "Esperando PostgreSQL... ($i/30)"
        sleep 2
    done
    
    print_success "Servicios base iniciados"
}

# Ejecutar migraciones de base de datos
run_database_migrations() {
    print_header "Ejecutando migraciones de base de datos..."
    
    print_status "Generando cliente Prisma..."
    docker-compose exec -T backend npx prisma generate
    
    print_status "Ejecutando migraciones..."
    docker-compose exec -T backend npx prisma migrate deploy
    
    print_status "Ejecutando seed de la base de datos..."
    docker-compose exec -T backend npx prisma db seed
    
    print_success "Migraciones completadas"
}

# Iniciar servicios completos
start_all_services() {
    print_header "Iniciando todos los servicios..."
    
    print_status "Iniciando backend..."
    docker-compose up -d backend
    
    print_status "Esperando que el backend esté listo..."
    sleep 10
    
    print_status "Iniciando frontend..."
    docker-compose up -d frontend
    
    print_success "Todos los servicios iniciados"
}

# Verificar estado de servicios
check_services_status() {
    print_header "Verificando estado de servicios..."
    
    print_status "Estado de contenedores:"
    docker-compose ps
    
    print_status "Verificando conectividad..."
    
    # Verificar PostgreSQL
    if docker-compose exec -T postgres pg_isready -U flame_ai_user -d flame_ai >/dev/null 2>&1; then
        print_success "✅ PostgreSQL: Conectado"
    else
        print_error "❌ PostgreSQL: Error de conexión"
    fi
    
    # Verificar Redis
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_success "✅ Redis: Conectado"
    else
        print_error "❌ Redis: Error de conexión"
    fi
    
    # Verificar Backend
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        print_success "✅ Backend: Conectado (http://localhost:8080)"
    else
        print_warning "⚠️ Backend: No responde (puede estar iniciando)"
    fi
    
    # Verificar Frontend
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "✅ Frontend: Conectado (http://localhost:3000)"
    else
        print_warning "⚠️ Frontend: No responde (puede estar iniciando)"
    fi
}

# Mostrar información final
show_final_info() {
    print_header "🎉 Reconstrucción completada exitosamente!"
    
    echo ""
    echo "📋 Información de acceso:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend:  http://localhost:8080"
    echo "📊 API Docs: http://localhost:8080/api"
    echo ""
    echo "👤 Credenciales de acceso:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📧 Email: admin@flameai.com"
    echo "🔑 Contraseña: admin123"
    echo ""
    echo "🗄️ Base de datos:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🏠 Host: localhost:5432"
    echo "👤 Usuario: flame_ai_user"
    echo "🔑 Contraseña: flame_ai_pass"
    echo "📁 Base de datos: flame_ai"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Ver logs: docker-compose logs -f"
    echo "🛑 Detener: docker-compose down"
    echo "🔄 Reiniciar: docker-compose restart"
    echo "🧹 Limpiar: ./rebuild-all.sh"
    echo ""
    echo "📚 Documentación:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📖 README: README.md"
    echo "🚀 Guía inicio: GETTING_STARTED.md"
    echo "👨‍💻 Desarrollo: docs/DEVELOPMENT.md"
    echo ""
}

# Función principal
main() {
    echo "🔥 Flame AI CRM - Reconstrucción Completa"
    echo "=========================================="
    echo ""
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "docker-compose.yml" ]; then
        print_error "No se encontró docker-compose.yml. Asegúrate de estar en el directorio del proyecto."
        exit 1
    fi
    
    # Ejecutar pasos
    check_dependencies
    cleanup_everything
    clean_local_dirs
    create_env_files
    create_directories
    rebuild_docker_images
    start_base_services
    run_database_migrations
    start_all_services
    
    # Esperar un poco para que los servicios se estabilicen
    print_status "Esperando que los servicios se estabilicen..."
    sleep 15
    
    check_services_status
    show_final_info
    
    print_success "¡Reconstrucción completada! 🎉"
}

# Ejecutar función principal
main "$@" 