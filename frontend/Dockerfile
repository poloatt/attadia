FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install
RUN npm install axios react-hot-toast

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Configurar Vite para escuchar en todas las interfaces
ENV VITE_HOST=0.0.0.0

# Comando para desarrollo
CMD ["npm", "run", "dev"]
