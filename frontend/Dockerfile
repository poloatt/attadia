# Etapa de construcción
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache wget curl git

# Configurar npm
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set strict-ssl false

# Crear directorio para node_modules y establecer permisos
RUN mkdir -p /app/node_modules && \
    chown -R node:node /app && \
    chmod -R 755 /app

# Cambiar al usuario node
USER node

# Copiar package.json y package-lock.json con los permisos correctos
COPY --chown=node:node package*.json ./

# Limpiar caché y node_modules
RUN npm cache clean --force && \
    rm -rf node_modules

# Instalar dependencias específicas primero
RUN npm install @mui/x-date-pickers@5.0.20 \
    date-fns@2.30.0 \
    @mui/material@5.15.11 \
    @emotion/react@11.11.3 \
    @emotion/styled@11.11.0 \
    @mui/icons-material@5.15.11

# Instalar el resto de dependencias
RUN npm install --legacy-peer-deps

# Copiar el archivo .env y el resto de la aplicación con los permisos correctos
COPY --chown=node:node .env .env
COPY --chown=node:node . .

# Asegurar que todos los archivos tengan los permisos correctos
RUN chmod -R 755 /app

# Variables de entorno para desarrollo
ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=5173
ENV HOST=0.0.0.0
ENV PORT=5173
ENV VITE_API_URL=http://localhost:5000
ENV VITE_GOOGLE_CLIENT_ID=21564026422-0ncvsjsea468s3o4qrmlaljos0d2cumk.apps.googleusercontent.com

# Exponer el puerto de Vite
EXPOSE 5173

# Healthcheck más tolerante
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5173 || wget -q --spider http://localhost:5173 || exit 1

# Comando para desarrollo con host explícito y opciones de Vite
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port 5173 --force"]
