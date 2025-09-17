#!/bin/bash

# Renovar certificados
sudo certbot renew

# Copiar los certificados renovados al directorio de nginx
sudo cp /etc/letsencrypt/live/present.attadia.com/fullchain.pem /home/poloatt/present/config/ssl/nginx/ssl/
sudo cp /etc/letsencrypt/live/present.attadia.com/privkey.pem /home/poloatt/present/config/ssl/nginx/ssl/

# Ajustar permisos
sudo chown poloatt:poloatt /home/poloatt/present/config/ssl/nginx/ssl/*.pem

# Reiniciar el contenedor frontend
cd /home/poloatt/present
docker-compose -f docker-compose.prod.yml restart frontend 