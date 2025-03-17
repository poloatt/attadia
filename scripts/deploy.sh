#!/bin/bash

# Variables
PROJECT_ID="present-webapp-449410"
REGION="southamerica-west1"
ZONE="southamerica-west1-c"
VM_NAME="foco-prod"
DOMAIN="present.attadia.com"

# Instrucciones para desplegar en la VM existente
echo "=== INSTRUCCIONES PARA DESPLEGAR EN VM EXISTENTE ==="
echo "1. Conectarse a la VM: gcloud compute ssh --zone \"$ZONE\" \"$VM_NAME\" --project \"$PROJECT_ID\""
echo "2. Crear directorio del proyecto: mkdir -p ~/present-prod"
echo "3. Copiar el archivo docker-compose.prod.yml a ~/present-prod/docker-compose.yml"
echo ""
echo "=== CONFIGURACIÓN DEL ENTORNO EN LA VM ==="
echo "Ejecute los siguientes comandos en la VM:"
echo ""
echo "# Crear directorios necesarios"
echo "mkdir -p ~/present-prod/backend"
echo "mkdir -p ~/present-prod/frontend"
echo "mkdir -p ~/present-prod/nginx/conf.d"
echo "mkdir -p ~/present-prod/ssl/nginx/ssl"
echo "mkdir -p ~/present-prod/mongodb_backup"
echo ""
echo "# Instalar Docker si no está instalado"
echo "sudo apt-get update"
echo "sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common"
echo "curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -"
echo "sudo add-apt-repository \"deb [arch=amd64] https://download.docker.com/linux/debian \$(lsb_release -cs) stable\""
echo "sudo apt-get update"
echo "sudo apt-get install -y docker-ce docker-ce-cli containerd.io"
echo "sudo usermod -aG docker \$USER"
echo ""
echo "# Instalar Docker Compose si no está instalado"
echo "sudo curl -L \"https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
echo "sudo chmod +x /usr/local/bin/docker-compose"
echo ""
echo "# Iniciar los servicios"
echo "cd ~/present-prod && sudo docker-compose up -d"
echo ""
echo "=== NOTA ==="
echo "Para configurar backups automáticos y otras tareas de mantenimiento, utilice el script setup-production.sh"
echo "Para actualizaciones automáticas, utilice el script auto-deploy.sh"

# Configurar gcloud
echo "Configurando gcloud..."
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION

# Crear VM si no existe
if ! gcloud compute instances describe $VM_NAME &>/dev/null; then
    echo "Creando VM..."
    gcloud compute instances create $VM_NAME \
        --machine-type=e2-medium \
        --zone=$REGION-a \
        --tags=http-server,https-server \
        --image-family=ubuntu-2004-lts \
        --image-project=ubuntu-os-cloud
fi

# Configurar firewall
echo "Configurando reglas de firewall..."
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --target-tags http-server
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --target-tags https-server

# Obtener IP externa
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME --zone=$REGION-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "IP externa: $EXTERNAL_IP"
echo "Por favor, configure los siguientes registros DNS:"
echo "A     $DOMAIN         $EXTERNAL_IP"
echo "A     api.$DOMAIN    $EXTERNAL_IP"

# Instrucciones finales
echo "
Próximos pasos:
1. Configurar registros DNS
2. SSH a la VM: gcloud compute ssh $VM_NAME --zone=$REGION-a
3. Clonar repositorio y cambiar a rama producción
4. Ejecutar: docker-compose -f docker-compose.prod.yml up -d
"

# Script para desplegar la aplicación en producción

# Crear directorio del proyecto si no existe
mkdir -p ~/present-prod

# Copiar el archivo docker-compose.yml
cat > ~/present-prod/docker-compose.yml << 'EOL'
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-MiContraseñaSegura123}
      MONGO_INITDB_DATABASE: ${MONGO_DB:-present}
      ENVIRONMENT: production
    volumes:
      - mongodb_prod_data:/data/db
      - ./mongodb_backup:/mongodb_backup
    networks:
      - app_network_prod
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        tag: "mongodb-prod"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        - BUILD_ENV=production
    image: present/backend:production
    container_name: backend
    restart: always
    expose:
      - "5000"
    env_file:
      - ./backend/.env.prod
    environment:
      - NODE_ENV=production
      - ENVIRONMENT=production
      - MONGODB_URI=mongodb://${MONGO_USER:-admin}:${MONGO_PASSWORD:-MiContraseñaSegura123}@mongodb:27017/${MONGO_DB:-present}?authSource=admin
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - app_network_prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        tag: "backend-prod"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - BUILD_ENV=production
    image: present/frontend:production
    container_name: frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    env_file:
      - ./frontend/.env.prod
    environment:
      - NODE_ENV=production
      - ENVIRONMENT=production
    volumes:
      - ./nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf
      - ./ssl/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - app_network_prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        tag: "frontend-prod"

volumes:
  mongodb_prod_data:
    name: present_mongodb_prod_data

networks:
  app_network_prod:
    name: present_app_network_prod
EOL

# Crear directorios necesarios
mkdir -p ~/present-prod/backend
mkdir -p ~/present-prod/frontend
mkdir -p ~/present-prod/nginx/conf.d
mkdir -p ~/present-prod/ssl/nginx/ssl
mkdir -p ~/present-prod/mongodb_backup

# Crear archivo .env.prod para backend
cat > ~/present-prod/backend/.env.prod << 'EOL'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin
JWT_SECRET=tu_secreto_jwt_seguro
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
FRONTEND_URL=https://tu-dominio-produccion.com
EOL

# Crear archivo .env.prod para frontend
cat > ~/present-prod/frontend/.env.prod << 'EOL'
REACT_APP_API_URL=https://tu-dominio-produccion.com/api
REACT_APP_ENVIRONMENT=production
REACT_APP_GOOGLE_CLIENT_ID=tu_google_client_id
EOL

# Crear archivo Dockerfile.prod para backend
cat > ~/present-prod/backend/Dockerfile.prod << 'EOL'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
EOL

# Crear archivo Dockerfile.prod para frontend
cat > ~/present-prod/frontend/Dockerfile.prod << 'EOL'
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
EOL

# Crear configuración de Nginx para producción
cat > ~/present-prod/nginx/conf.d/production.conf << 'EOL'
server {
    listen 80;
    server_name _;
    
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name _;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
EOL

# Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker no está instalado. Instalando Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    echo "Docker instalado. Por favor, cierra sesión y vuelve a iniciar para aplicar los cambios de grupo."
fi

# Instalar Docker Compose si no está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose no está instalado. Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose instalado."
fi

echo "Configuración completada. Para iniciar los servicios, ejecuta:"
echo "cd ~/present-prod && sudo docker-compose up -d" 