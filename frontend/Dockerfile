# Etapa de construcción
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache wget curl git

# Configurar npm
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set legacy-peer-deps true

# Copiar package.json y package-lock.json
COPY package*.json ./

# Limpiar caché y node_modules
RUN npm cache clean --force && \
    rm -rf node_modules

# Instalar dependencias específicas primero
RUN npm install @mui/x-date-pickers@5.0.20 \
    date-fns@2.30.0 \
    @mui/material@5.15.10 \
    @emotion/react@11.11.3 \
    @emotion/styled@11.11.0 \
    @mui/icons-material@5.15.10 \
    framer-motion@12.4.6 \
    lottie-react@2.4.1

# Instalar el resto de dependencias
RUN npm install --legacy-peer-deps

# Copiar el resto de la aplicación
COPY . .

# Crear directorio para node_modules y establecer permisos
RUN mkdir -p /app/node_modules && chown -R node:node /app

# Cambiar al usuario node
USER node

# Variables de entorno para desarrollo
ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=5173
ENV HOST=0.0.0.0
ENV PORT=5173

# Exponer el puerto de Vite
EXPOSE 5173

# Healthcheck más tolerante
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5173 || wget -q --spider http://localhost:5173 || exit 1

# Comando para desarrollo con host explícito y opciones de Vite
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port 5173 --force"]
