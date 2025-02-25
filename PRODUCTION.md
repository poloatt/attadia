# Configuración de Producción

## Configuración Inicial

1. Clona el repositorio en la VM de producción:
```bash
git clone <repositorio> /home/polo/presentprod
cd /home/polo/presentprod
```

2. Ejecuta el script de configuración:
```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

Este script:
- Crea los directorios necesarios para MongoDB (`/data/mongodb` y `/data/backups`)
- Configura los permisos correctos
- Configura el backup automático diario (3 AM)

3. Inicia los contenedores:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Gestión de Backups

### Backup Manual
Para hacer un backup manual:
```bash
./scripts/backup-mongodb.sh
```

Los backups se guardan en `/data/backups` con el formato `present_backup_YYYYMMDD_HHMMSS.tar.gz`

### Restaurar un Backup
Para restaurar un backup:
```bash
./scripts/restore-mongodb.sh nombre_del_backup.tar.gz
```

Si no especificas un archivo, el script mostrará los backups disponibles.

## Mantenimiento

### Logs
- Logs de MongoDB: `docker logs mongodb-prod`
- Logs de backups: `/data/backups/backup.log`

### Actualización
Para actualizar la aplicación:
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Verificación
Para verificar que todo está funcionando:
```bash
docker compose -f docker-compose.prod.yml ps
```

## Estructura de Directorios
```
/data/
├── mongodb/     # Datos persistentes de MongoDB
└── backups/     # Backups diarios de la base de datos
```

## Notas Importantes
- Los backups se realizan automáticamente a las 3 AM
- Se mantienen los últimos 7 backups
- Todos los datos persistentes se almacenan en `/data` 