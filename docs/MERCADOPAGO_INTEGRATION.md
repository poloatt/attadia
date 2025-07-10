# Integración con MercadoPago

## Descripción General

Esta aplicación incluye integración completa con MercadoPago para sincronización automática de transacciones. La integración permite:

- Sincronización automática de pagos recibidos y enviados
- Categorización automática de transacciones
- Sincronización programada (diaria, semanal, mensual)
- Gestión segura de credenciales encriptadas

## Configuración de MercadoPago

### 1. Crear una Aplicación en MercadoPago Developers

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Inicia sesión con tu cuenta de MercadoPago
3. Crea una nueva aplicación
4. Obtén tu **Access Token** de producción

### 2. Obtener tu User ID

1. Ve a tu perfil de MercadoPago
2. Tu User ID se encuentra en la URL o en la configuración de tu cuenta
3. También puedes obtenerlo haciendo una llamada a la API de MercadoPago

### 3. Configurar la Conexión en la Aplicación

1. Ve a **Assets > Finanzas > Conexiones Bancarias**
2. Haz clic en **"Nueva Conexión"**
3. Selecciona **"MercadoPago"** como tipo de conexión
4. Completa los campos:
   - **Nombre**: Un nombre descriptivo (ej: "Mi cuenta MercadoPago")
   - **Banco**: MercadoPago
   - **Cuenta**: Selecciona la cuenta donde se guardarán las transacciones
   - **Access Token**: Tu token de acceso de MercadoPago
   - **User ID**: Tu ID de usuario de MercadoPago

## Funcionalidades

### Sincronización Automática

La aplicación sincroniza automáticamente las transacciones de MercadoPago:

- **Frecuencia**: Configurable (diaria, semanal, mensual)
- **Horario**: 6:00 AM (diaria), 2:00 AM domingos (semanal), 3:00 AM primer día del mes (mensual)
- **Rango**: Desde la última sincronización hasta la fecha actual

### Tipos de Transacciones

La aplicación distingue automáticamente entre:

- **INGRESOS**: Pagos recibidos como vendedor
- **EGRESOS**: Pagos enviados como comprador

### Categorización Automática

Las transacciones se categorizan automáticamente basándose en la descripción:

- **Salud y Belleza**: farmacia, médico, hospital, etc.
- **Contabilidad y Facturas**: facturas, servicios, impuestos
- **Transporte**: uber, taxi, combustible
- **Comida y Mercado**: supermercado, restaurante
- **Fiesta**: bares, eventos
- **Ropa**: tiendas de ropa, calzado
- **Tecnología**: electrónica, software
- **Otro**: transacciones no categorizadas

### Estados de Transacciones

Las transacciones se mapean a estados internos:

- **COMPLETADA**: Pagos aprobados
- **PENDIENTE**: Pagos en proceso o pendientes
- **CANCELADA**: Pagos rechazados, cancelados o reembolsados

## API Endpoints

### Verificar Conexión
```
POST /api/bankconnections/verify
{
  "tipo": "MERCADOPAGO",
  "credenciales": {
    "accessToken": "tu_access_token",
    "userId": "tu_user_id"
  }
}
```

### Sincronizar Conexión Específica
```
POST /api/bankconnections/:id/sync
```

### Sincronizar Todas las Conexiones
```
POST /api/bankconnections/sync-all
```

## Seguridad

### Encriptación de Credenciales

- Todas las credenciales se encriptan antes de guardarse en la base de datos
- Se utiliza AES-256-CBC para la encriptación
- La clave de encriptación se configura mediante la variable de entorno `ENCRYPTION_KEY`

### Variables de Entorno Requeridas

```bash
ENCRYPTION_KEY=tu_clave_de_encriptacion_secreta
```

## Monitoreo y Logs

### Logs de Sincronización

La aplicación registra todas las operaciones de sincronización:

- Fecha y hora de sincronización
- Número de transacciones nuevas
- Número de transacciones actualizadas
- Errores y excepciones

### Historial de Sincronizaciones

Cada conexión bancaria mantiene un historial de:

- Últimas 50 sincronizaciones
- Estado de cada sincronización
- Estadísticas de transacciones procesadas

## Solución de Problemas

### Error: "Invalid Access Token"

1. Verifica que el Access Token sea válido
2. Asegúrate de usar el token de producción, no el de sandbox
3. Verifica que el token no haya expirado

### Error: "User ID not found"

1. Verifica que el User ID sea correcto
2. Asegúrate de que el User ID corresponda a la cuenta asociada al Access Token

### No se sincronizan transacciones

1. Verifica que la conexión esté en estado "ACTIVA"
2. Revisa los logs de sincronización
3. Ejecuta una sincronización manual para verificar

### Transacciones duplicadas

La aplicación evita duplicados verificando:
- ID de transacción de MercadoPago
- Fecha y monto de la transacción
- Cuenta asociada

## Limitaciones

### API de MercadoPago

- **Rate Limiting**: MercadoPago tiene límites de velocidad en sus APIs
- **Historial**: Solo se pueden obtener transacciones de los últimos 30 días por defecto
- **Webhooks**: No se implementan webhooks en esta versión

### Sincronización

- **Frecuencia**: Mínimo diaria para evitar sobrecarga
- **Rango**: Máximo 30 días por sincronización
- **Concurrencia**: Una sincronización por conexión a la vez

## Próximas Mejoras

- [ ] Implementación de webhooks para sincronización en tiempo real
- [ ] Sincronización de transferencias entre cuentas
- [ ] Filtros avanzados por tipo de pago
- [ ] Notificaciones push de nuevas transacciones
- [ ] Dashboard de estadísticas de sincronización

## Soporte

Para problemas técnicos o preguntas sobre la integración:

1. Revisa los logs de la aplicación
2. Verifica la configuración de credenciales
3. Consulta la documentación de MercadoPago Developers
4. Contacta al equipo de desarrollo

---

**Nota**: Esta integración está diseñada para uso personal y de pequeñas empresas. Para uso comercial a gran escala, considera implementar medidas adicionales de seguridad y monitoreo. 