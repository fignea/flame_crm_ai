#!/bin/bash

# Script de verificación para detectar errores de TypeScript y build
# Uso: ./scripts/check-errors.sh

set -e  # Salir si hay algún error

echo "🔍 Verificando errores en el proyecto..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Obtener el directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Verificar backend
echo "📦 Verificando backend..."
cd "$PROJECT_DIR/backend"

if npm run build > /dev/null 2>&1; then
    print_status "Backend build exitoso"
else
    print_error "Backend build falló"
    npm run build
    exit 1
fi

# Verificar frontend
echo "🎨 Verificando frontend..."
cd "$PROJECT_DIR/frontend"

# Verificar tipos
if npm run type-check > /dev/null 2>&1; then
    print_status "Frontend type-check exitoso"
else
    print_error "Frontend type-check falló"
    npm run type-check
    exit 1
fi

# Verificar build
if npm run build > /dev/null 2>&1; then
    print_status "Frontend build exitoso"
else
    print_error "Frontend build falló"
    npm run build
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
print_status "🎉 ¡Todas las verificaciones pasaron exitosamente!"
echo ""
echo "📋 Resumen de verificaciones:"
echo "   ✅ Backend TypeScript compilation"
echo "   ✅ Frontend TypeScript type-check"
echo "   ✅ Frontend build process"
echo ""
echo "💡 Para ejecutar este script automáticamente antes de commits,"
echo "   agrega esto a tu .git/hooks/pre-commit:"
echo "   ./scripts/check-errors.sh" 