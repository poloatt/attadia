# Etapa de construcción
FROM node:18-alpine as builder

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias necesarias
RUN apk add --no-cache wget curl git

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias con una configuración más estricta
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --no-audit --no-fund --no-optional

# Copiar el resto de los archivos
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar la configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
