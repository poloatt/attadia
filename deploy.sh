#!/bin/bash

# Variables
PROJECT_ID="present-attadia"
REGION="us-central1"
VM_NAME="present-prod"
DOMAIN="present.attadia.com"

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
2. SSH a la VM: gcloud compute ssh $VM_NAME
3. Clonar repositorio y cambiar a rama producción
4. Ejecutar: docker-compose -f docker-compose.prod.yml up -d
" 