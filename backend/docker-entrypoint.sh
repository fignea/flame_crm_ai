#!/bin/sh
set -e

echo "🚀 Iniciando backend..."

# Ejecutar migraciones Prisma antes de iniciar la app
echo "📦 Aplicando migraciones de base de datos..."
npx prisma migrate deploy

# Ejecutar seed si es necesario (solo en desarrollo)
if [ "$NODE_ENV" != "production" ]; then
    echo "🌱 Ejecutando seed de datos..."
    npx ts-node prisma/seed.ts
fi

echo "✅ Base de datos lista!"
echo "🚀 Iniciando aplicación..."

exec "$@" 