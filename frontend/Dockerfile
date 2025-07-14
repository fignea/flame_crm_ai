# Multi-stage build para optimizar el tamaño de la imagen
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Stage de desarrollo
FROM base AS development

# Instalar dependencias
RUN npm install --force

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 5173

# Comando para desarrollo
CMD ["npm", "run", "dev"]

# Stage de build
FROM base AS build

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Stage de producción
FROM nginx:alpine AS production

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Crear archivo de configuración para variables de entorno
RUN echo 'window.ENV = { \
  VITE_API_URL: "${VITE_API_URL}", \
  VITE_BACKEND_URL: "${VITE_BACKEND_URL}", \
  VITE_APP_NAME: "${VITE_APP_NAME}" \
};' > /usr/share/nginx/html/env-config.js.template

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Script de inicio para sustituir variables de entorno
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Comando para producción
CMD ["/docker-entrypoint.sh"] 