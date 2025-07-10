# Guía de Sincronización Bancaria

## Descripción General

El sistema de sincronización bancaria permite conectar automáticamente con APIs bancarias para importar transacciones directamente a la aplicación. Las transacciones se sincronizan automáticamente y aparecen en la página de Transacciones como si hubieran sido creadas manualmente.

## Características Principales

- **Múltiples tipos de conexión**: Plaid, Open Banking, API Directa, Manual
- **Sincronización automática**: Diaria, semanal o mensual
- **Categorización automática**: Las transacciones se categorizan automáticamente
- **Encriptación de credenciales**: Las credenciales bancarias se almacenan de forma segura
- **Historial de sincronización**: Seguimiento completo de todas las sincronizaciones
- **Interfaz de usuario**: Gestión completa desde la aplicación web

## Arquitectura del Sistema

### Backend

1. **Modelo BankConnection** (`backend/src/models/BankConnection.js`)
   - Almacena configuraciones de conexiones bancarias
   - Incluye credenciales encriptadas y configuraciones de sincronización

2. **Servicio de Sincronización** (`backend/src/services/bankSyncService.js`)
   - Maneja la lógica de sincronización con diferentes APIs bancarias
   - Categorización automática de transacciones
   - Encriptación/desencriptación de credenciales

3. **Controlador** (`backend/src/controllers/bankConnectionController.js`)
   - API REST para gestionar conexiones bancarias
   - Endpoints para sincronización manual y automática

4. **Scheduler** (`backend/src/scripts/bankSyncScheduler.js`)
   - Programación automática de sincronizaciones
   - Ejecución de sincronizaciones por frecuencia

### Frontend

1. **Página de Conexiones** (`frontend/src/pages/BankConnections.jsx`)
   - Gestión de todas las conexiones bancarias
   - Sincronización manual y automática

2. **Formulario de Conexión** (`frontend/src/components/bankconnections/BankConnectionForm.jsx`)
   - Configuración de nuevas conexiones bancarias
   - Validación de credenciales

## Tipos de Conexión Soportados

### 1. Plaid
- **Descripción**: Conecta con más de 11,000 instituciones financieras
- **Credenciales requeridas**: Access Token, Institution ID, Account ID
- **Uso**: Ideal para la mayoría de bancos estadounidenses y algunos internacionales

### 2. Open Banking
- **Descripción**: Estándar europeo de APIs bancarias
- **Credenciales requeridas**: Access Token, Refresh Token
- **Uso**: Bancos europeos que implementan PSD2

### 3. API Directa
- **Descripción**: Conexión directa con la API del banco
- **Credenciales requeridas**: API Key, API Secret, Usuario, Contraseña
- **Uso**: Bancos que ofrecen APIs públicas

### 4. Manual
- **Descripción**: Importación manual de transacciones
- **Credenciales**: No requeridas
- **Uso**: Para casos donde no hay API disponible

## Conexión con MercadoPago (OAuth)

Ahora la integración con MercadoPago utiliza OAuth para una experiencia moderna y segura:

1. Haz clic en “Conectar con MercadoPago”.
2. Autoriza la app en la ventana de MercadoPago.
3. Al volver a la app, la conexión se crea automáticamente y se sincronizan los movimientos.
4. No es necesario ingresar manualmente el User ID ni el Access Token.

### Endpoints relevantes:
- `GET /api/bankconnections/mercadopago/auth-url` — Devuelve la URL de autorización de MercadoPago.
- `POST /api/bankconnections/mercadopago/callback` — Recibe el código OAuth, obtiene el access token y userId, y crea la conexión bancaria.

### Flujo de usuario:
- El usuario inicia el flujo desde el frontend.
- Se redirige a MercadoPago para autorizar la app.
- Al volver, el backend intercambia el código por el token y crea la conexión.
- La sincronización es automática tras la conexión.

## Configuración

### 1. Instalación de Dependencias

```bash
# Backend
cd backend
npm install node-cron

# Frontend (no requiere dependencias adicionales)
cd frontend
npm install
```

### 2. Variables de Entorno

Agregar al archivo `.env` del backend:

```env
# Clave de encriptación para credenciales bancarias
ENCRYPTION_KEY=tu_clave_secreta_muy_larga_y_segura

# Configuración de timezone para el scheduler
TZ=America/Santiago
```

### 3. Configuración de Plaid (Opcional)

Si vas a usar Plaid, necesitas:

```env
PLAID_CLIENT_ID=tu_client_id
PLAID_SECRET=tu_secret
PLAID_ENV=sandbox  # o development, production
```

## Uso del Sistema

### 1. Crear una Conexión Bancaria

1. Ve a la página de **Conexiones Bancarias**
2. Haz clic en **"Nueva Conexión"**
3. Completa la información:
   - **Nombre**: Nombre descriptivo para la conexión
   - **Banco**: Selecciona o escribe el nombre del banco
   - **Tipo de conexión**: Plaid, Open Banking, API Directa o Manual
   - **Cuenta asociada**: Selecciona la cuenta donde se importarán las transacciones
   - **Credenciales**: Según el tipo de conexión
   - **Configuración**: Frecuencia de sincronización y categorización automática

4. Haz clic en **"Verificar"** para probar la conexión
5. Haz clic en **"Crear"** para guardar la conexión

### 2. Sincronización Manual

- **Individual**: Haz clic en **"Sincronizar"** en cada conexión
- **Masiva**: Haz clic en **"Sincronizar Todas"** en la página de conexiones

### 3. Sincronización Automática

El sistema ejecuta automáticamente las sincronizaciones según la frecuencia configurada:

- **Diaria**: 6:00 AM
- **Semanal**: Domingos 2:00 AM
- **Mensual**: Primer día del mes 3:00 AM

### 4. Ver Transacciones Sincronizadas

Las transacciones sincronizadas aparecen automáticamente en la página de **Transacciones** con:

- **Estado**: "COMPLETADA" (las transacciones bancarias vienen como completadas)
- **Origen**: "BANCARIO" (para identificar que vienen de sincronización)
- **Categoría**: Automática o "Otro" según la configuración

## Categorización Automática

El sistema categoriza automáticamente las transacciones basándose en palabras clave en la descripción:

- **Salud y Belleza**: farmacia, medico, doctor, hospital, clinica, salud, belleza, cosmeticos
- **Contabilidad y Facturas**: factura, impuesto, servicio, luz, agua, gas, internet, telefono
- **Transporte**: uber, taxi, bus, metro, combustible, gasolina, nafta, estacionamiento
- **Comida y Mercado**: supermercado, restaurante, cafe, comida, mercado, verduleria, carniceria
- **Fiesta**: bar, pub, discoteca, fiesta, evento, entrada, ticket
- **Ropa**: ropa, zapatillas, calzado, tienda, shopping, moda
- **Tecnología**: tecnologia, electronica, computadora, celular, software, app
- **Otro**: Para transacciones que no coinciden con ninguna categoría

## Seguridad

### Encriptación de Credenciales

- Las credenciales sensibles se encriptan usando AES-256-CBC
- La clave de encriptación se almacena en variables de entorno
- Solo se desencriptan durante la sincronización

### Validación de Acceso

- Cada usuario solo puede acceder a sus propias conexiones bancarias
- Las transacciones se asocian automáticamente al usuario propietario
- Validación de permisos en todos los endpoints

## Monitoreo y Logs

### Historial de Sincronización

Cada conexión mantiene un historial de las últimas 50 sincronizaciones con:

- Fecha y hora
- Estado (EXITOSA, ERROR, PARCIAL)
- Número de transacciones nuevas y actualizadas
- Mensajes de error (si aplica)

### Logs del Sistema

El sistema registra logs detallados para:

- Inicio/detención del scheduler
- Ejecución de sincronizaciones programadas
- Errores de conexión y sincronización
- Resúmenes de sincronización masiva

## Pruebas

### Script de Prueba

Para probar el sistema de sincronización:

```bash
cd backend
node src/scripts/testBankSync.js
```

Este script:
1. Crea datos de prueba (usuario, cuenta, conexión bancaria)
2. Ejecuta sincronización individual y masiva
3. Verifica que las transacciones se creen correctamente
4. Muestra un resumen de los resultados

### Pruebas Manuales

1. **Crear conexión de prueba**:
   - Tipo: Plaid
   - Credenciales: Cualquier valor (el sistema simula la sincronización)
   - Frecuencia: Diaria

2. **Sincronizar manualmente**:
   - Verificar que se creen transacciones simuladas
   - Comprobar que aparezcan en la página de Transacciones

3. **Verificar categorización**:
   - Las transacciones simuladas deberían categorizarse automáticamente

## Integración con APIs Reales

### Plaid

Para integrar con Plaid real:

1. Registrarse en [Plaid](https://plaid.com)
2. Obtener credenciales de desarrollo
3. Modificar `bankSyncService.js` para usar la API real de Plaid
4. Reemplazar las funciones de simulación con llamadas reales

### Open Banking

Para integrar con Open Banking:

1. Verificar que el banco soporte PSD2
2. Obtener credenciales de la API del banco
3. Implementar el flujo OAuth2 si es requerido
4. Modificar `bankSyncService.js` para usar la API real

### APIs Directas

Para APIs directas de bancos:

1. Consultar la documentación de la API del banco
2. Implementar autenticación específica
3. Mapear los campos de respuesta al formato interno
4. Modificar `bankSyncService.js` para usar la API real

## Troubleshooting

### Problemas Comunes

1. **Error de encriptación**:
   - Verificar que `ENCRYPTION_KEY` esté configurada
   - La clave debe ser de al menos 32 caracteres

2. **Sincronización no funciona**:
   - Verificar que la conexión esté en estado "ACTIVA"
   - Revisar logs del servidor para errores específicos
   - Comprobar que las credenciales sean correctas

3. **Transacciones duplicadas**:
   - El sistema evita duplicados comparando fecha, monto y descripción
   - Si ocurren duplicados, verificar la lógica de comparación

4. **Scheduler no ejecuta**:
   - Verificar que el timezone esté configurado correctamente
   - Comprobar que el servidor esté ejecutándose
   - Revisar logs del scheduler

### Logs Útiles

```bash
# Ver logs del servidor
docker logs -f backend

# Ver logs específicos de sincronización
grep "sincronización" logs/app.log

# Ver estado del scheduler
curl http://localhost:8080/api/health
```

## Próximas Mejoras

1. **Notificaciones**: Enviar notificaciones por email/SMS cuando hay errores
2. **Webhooks**: Recibir notificaciones en tiempo real de nuevas transacciones
3. **Reconciliación**: Herramientas para reconciliar transacciones manuales vs automáticas
4. **Análisis**: Reportes y análisis de patrones de gastos
5. **Multi-moneda**: Soporte mejorado para múltiples monedas
6. **Backup**: Sistema de backup de credenciales y configuraciones

## Soporte

Para problemas o preguntas:

1. Revisar los logs del sistema
2. Verificar la configuración de variables de entorno
3. Probar con el script de prueba
4. Consultar la documentación de la API específica del banco
5. Contactar al equipo de desarrollo con logs y detalles del problema 