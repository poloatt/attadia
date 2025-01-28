FROM node:18

WORKDIR /app

# Crear nuevo proyecto React primero
RUN npx create-react-app .

# Instalar dependencias incluyendo la que falta
RUN npm install @mui/material @mui/icons-material @emotion/react @emotion/styled react-router-dom@6.21.3 axios && \
    npm install --save-dev @babel/plugin-proposal-private-property-in-object

# Limpiar la carpeta src por defecto pero mantener index.html
RUN find src -type f ! -name 'index.html' -delete

# Crear estructura de carpetas
RUN mkdir -p src/components \
    src/context \
    src/hooks \
    src/layouts \
    src/pages \
    src/services \
    src/utils

# Copiar todo el código fuente
COPY ./src ./src

EXPOSE 3000

CMD ["npm", "start"]
