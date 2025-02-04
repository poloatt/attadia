# Usar una imagen base de Node.js
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias necesarias
RUN apk add --no-cache curl wget

# Copiar package.json y package-lock.json
COPY package*.json ./

# Limpiar cache de npm e instalar dependencias
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --verbose && \
    npm install morgan@1.10.0

# Copiar el resto de la aplicación
COPY . .

# Variables de entorno
ENV NODE_ENV=development
ENV PORT=5000

# Exponer el puerto
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || wget -q --spider http://localhost:5000/api/health || exit 1

# Comando para iniciar la aplicación
CMD ["npm", "run", "dev"]