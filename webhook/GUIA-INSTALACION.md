# Guía de Instalación y Puesta en Marcha

Esta guía explica paso a paso cómo instalar y configurar el sistema de webhooks para el despliegue automático de Present App.

## 1. Instalación en el Servidor (Producción o Staging)

### Conexión al servidor

Primero, conéctate al servidor mediante SSH:

```bash
# Para entorno de staging
gcloud compute ssh --zone "southamerica-west1-c" "foco-staging" --project "present-webapp-449410"

# Para entorno de producción
gcloud compute ssh --zone "southamerica-west1-c" "foco-prod" --project "present-webapp-449410"
```

### Clonar o actualizar el repositorio

Asegúrate de que el repositorio esté clonado y actualizado:

```bash
# Si no existe el repositorio, clónalo
cd /home/poloatt
git clone https://github.com/tu-usuario/present.git
cd present

# Si ya existe, actualízalo
cd /home/poloatt/present
git pull origin main  # o la rama correspondiente
```

### Instalación del servicio de webhook

Una vez que tengas el repositorio actualizado:

```bash
# Ir al directorio del webhook
cd /home/poloatt/present/webhook

# Hacer ejecutables los scripts
chmod +x *.sh

# Instalar el servicio (requiere permisos sudo)
sudo ./install-webhook.sh
```

### Verificar la instalación

Comprueba que el servicio esté funcionando correctamente:

```bash
# Verificar estado del servicio
sudo systemctl status present-webhook

# Ver los logs
tail -f /var/log/webhook-server/webhook.log
```

### Configurar el webhook en GitHub

1. Ve a tu repositorio en GitHub
2. Navega a Settings > Webhooks > Add webhook
3. Configura los siguientes campos:
   - Payload URL: `https://webhook.tu-dominio.com/webhook` (o la URL del servidor)
   - Content type: `application/json`
   - Secret: El mismo valor que configuraste en `WEBHOOK_SECRET`
   - Eventos: Selecciona "Just the push event"
   - Activo: Marca como activo

## 2. Primer despliegue manual

Para inicializar el sistema, es recomendable hacer un primer despliegue manual:

```bash
# En el servidor, navega al directorio del proyecto
cd /home/poloatt/present

# Ejecuta el script de auto-deploy para el ambiente correspondiente
./scripts/auto-deploy.sh production  # o staging
```

Este primer despliegue manual hará:
1. Crear los backups iniciales
2. Configurar las bases de datos
3. Iniciar todos los contenedores necesarios

## 3. Probando el sistema de webhook

Puedes probar el sistema sin necesidad de hacer un push a GitHub:

```bash
# Prueba manual del webhook
curl -X GET "http://localhost:9000/test-deploy?token=secreto123&env=production"
```

## 4. Uso diario

Una vez configurado, el sistema funcionará automáticamente:

1. Cuando haces push a la rama `main` (o `master`/`production`), se despliega en producción
2. Cuando haces push a la rama `staging`, se despliega en staging
3. El sistema realizará automáticamente:
   - Backup de la base de datos
   - Actualización del código (git pull)
   - Reconstrucción de contenedores Docker
   - Verificación de servicios
   - Rollback automático en caso de fallo

## 5. Mantenimiento y solución de problemas

### Logs

Los logs del sistema se almacenan en:
```
/var/log/webhook-server/webhook.log
```

También puedes consultar los logs del servicio systemd:
```
journalctl -u present-webhook -f
```

### Reiniciar el servicio

Si necesitas reiniciar el servicio:
```bash
sudo systemctl restart present-webhook
```

### Verificar el espacio de backups

Para comprobar el espacio usado por los backups:
```bash
du -sh /data/backups/*
```

### Restaurar desde un backup

Si necesitas restaurar desde un backup:
```bash
cd /home/poloatt/present
./scripts/restore-mongodb.sh nombre_del_backup.tar.gz production
```

## 6. Actualización del sistema de webhook

Para actualizar el sistema de webhook:

```bash
# Actualizar el repositorio
cd /home/poloatt/present
git pull origin main

# Reinstalar el servicio
cd webhook
sudo ./install-webhook.sh
```

---

## Compatibilidad con los scripts existentes

Este nuevo sistema de webhook no reemplaza los scripts existentes, sino que los complementa:

- **scripts/auto-deploy.sh**: Sigue siendo útil para despliegues manuales o programados
- **scripts/backup-mongodb.sh**: Se puede usar para backups manuales adicionales
- **scripts/restore-mongodb.sh**: Imprescindible para restauraciones manuales
- **scripts/setup-production.sh**: Útil para configuración inicial de servidores

Todos estos scripts seguirán funcionando normalmente y pueden usarse junto con el sistema de webhook. 