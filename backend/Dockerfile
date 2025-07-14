# Usar una imagen base más estable
FROM node:20-alpine

# Instalar dependencias del sistema, incluyendo git
RUN apk add --no-cache libc6-compat openssl git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Limpieza forzada para evitar problemas de caché
RUN rm -rf node_modules package-lock.json && npm cache clean --force

# Instalar dependencias de producción
RUN npm install --legacy-peer-deps

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el resto de los archivos de la aplicación
COPY . .

# Compilar la aplicación
RUN npm run build

# Crear directorios necesarios
RUN mkdir -p uploads logs

# Exponer el puerto de la aplicación
EXPOSE 8080

# Health check simple
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Establecer el punto de entrada
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]

# Comando para producción
CMD ["npm", "start"] 