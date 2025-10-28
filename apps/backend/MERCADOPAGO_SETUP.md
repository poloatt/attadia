# Configuración de MercadoPago para Attadia

## Problema Común: Error en Página de Autorización

Si al intentar conectar con MercadoPago ves una página de error antes del callback, el problema suele ser:

1. **redirect_uri no registrado** en el panel de MercadoPago
2. **client_id o client_secret** inválidos o mal configurados
3. **Inconsistencia entre ambientes** (desarrollo vs producción)

## Pasos de Configuración

### 1. Acceder al Panel de MercadoPago

Ve a: https://www.mercadopago.com.ar/developers/panel/app

### 2. Crear/Editar Aplicación

1. Si no tienes una aplicación, crea una nueva
2. Si ya tienes una, haz click en "Editar"

### 3. Configurar Redirect URIs (CRÍTICO)

⚠️ **IMPORTANTE**: Debes agregar las URLs EXACTAS que usará tu aplicación.

En la sección **"Redirect URIs"** (NO en Webhooks), agrega:

#### Para Desarrollo (localhost):
```
http://localhost:5174/mercadopago/callback
```

#### Para Producción:
```
https://atta.attadia.com/mercadopago/callback
```

**Nota**: La URL debe terminar en `/mercadopago/callback` exactamente.

### 4. Obtener Credenciales

En el panel de tu aplicación, copia:

- **Client ID** (App ID)
- **Client Secret**

### 5. Configurar Variables de Entorno

#### Backend (.env o .env.production):

```bash
# MercadoPago OAuth Credentials
MERCADOPAGO_CLIENT_ID=tu_client_id_aqui
MERCADOPAGO_CLIENT_SECRET=tu_client_secret_aqui

# Frontend URLs (importante para el callback)
FRONTEND_URL=https://atta.attadia.com  # en producción
# FRONTEND_URL=http://localhost:5174  # en desarrollo
```

#### Verificar configuración:

Puedes usar el endpoint de diagnóstico para verificar:

```bash
# En desarrollo
curl http://localhost:5000/api/bankconnections/mercadopago/diagnostico

# En producción
curl https://api.attadia.com/api/bankconnections/mercadopago/diagnostico
```

## Diferencia entre OAuth Callback y Webhooks

### OAuth Callback (lo que necesitas para sync):
- **Propósito**: Autorización inicial del usuario
- **URL Frontend**: `https://atta.attadia.com/mercadopago/callback`
- **Método**: GET con query params (code, state)
- **Cuándo se usa**: Cuando el usuario hace click en "Sync" por primera vez

### Webhooks (opcional, para notificaciones automáticas):
- **Propósito**: Recibir notificaciones de eventos (pagos, etc.)
- **URL Backend**: `https://api.attadia.com/api/webhooks/mercadopago`
- **Método**: POST
- **Cuándo se usa**: MercadoPago envía notificaciones automáticamente

## Flujo Completo de OAuth

1. Usuario hace click en "Sync" → Frontend
2. Frontend solicita authUrl al backend → `GET /api/bankconnections/mercadopago/auth-url`
3. Backend genera URL con MercadoPago → incluye `redirect_uri`
4. Usuario es redirigido a MercadoPago
5. Usuario autoriza la aplicación
6. MercadoPago redirige a `redirect_uri` con `code` y `state`
7. Frontend captura el callback → `MercadoPagoCallbackPage`
8. Frontend envía code al backend → `POST /api/bankconnections/mercadopago/callback`
9. Backend intercambia code por tokens
10. Backend crea cuenta y conexión en DB
11. Usuario puede ver sus datos de MercadoPago en Attadia

## Troubleshooting

### Error: "La prueba de esta URL falló"
- Estás en la sección de **Webhooks**, no OAuth
- Usa la sección **"Redirect URIs"** en su lugar

### Error en página de autorización de MercadoPago
- Verifica que el redirect_uri esté registrado exactamente como se usa
- Verifica client_id y client_secret en variables de entorno
- Revisa los logs del backend para ver la URL exacta generada

### Error 400: "redirect_uri inválido"
- El redirect_uri enviado no coincide con los registrados
- Asegúrate de incluir el protocolo (http:// o https://)
- Asegúrate de incluir el puerto en desarrollo (5174)

### Error 400: "state inválido"
- El state expiró (válido por 5 minutos)
- Problema de sesiones entre frontend y backend
- Intenta limpiar cookies y volver a intentar

## Testing

### 1. Verificar configuración:
```bash
curl http://localhost:5000/api/bankconnections/mercadopago/diagnostico
```

### 2. Verificar logs del backend:
Deberías ver logs detallados al iniciar el flujo OAuth:
```
=== [MercadoPago OAuth] Generando URL de autorización ===
Client ID: 123456789...
Redirect URI recibido: http://localhost:5174/mercadopago/callback
```

### 3. Verificar logs del frontend:
En la consola del navegador:
```
=== [MercadoPago Frontend] Iniciando obtención de URL de autorización ===
🔵 Redirect URI calculado: http://localhost:5174/mercadopago/callback
```

### 4. Comparar URLs:
Las URLs deben coincidir exactamente entre:
- Frontend (calculada dinámicamente)
- Backend (recibida y usada)
- MercadoPago (registrada en el panel)

## Scopes Solicitados

La aplicación solicita los siguientes permisos:
- `read`: Leer información del usuario
- `offline_access`: Obtener refresh_token para acceso prolongado
- `write`: Crear preferencias de pago (futuro)

## Seguridad

- El parámetro `state` previene ataques CSRF
- Los tokens se encriptan antes de guardarse en la base de datos
- El refresh_token permite renovar el acceso sin re-autorización
- Las sesiones expiran después de 5 minutos

