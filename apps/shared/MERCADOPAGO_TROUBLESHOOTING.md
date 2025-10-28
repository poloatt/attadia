# MercadoPago - Guía de Troubleshooting

## Diagnóstico Rápido

### Endpoint de Diagnóstico

Puedes verificar la configuración de MercadoPago usando el endpoint de diagnóstico:

```bash
# Desarrollo
curl http://localhost:5000/api/bankconnections/mercadopago/diagnostico

# Producción
curl https://api.attadia.com/api/bankconnections/mercadopago/diagnostico
```

**Respuesta esperada:**

```json
{
  "status": "ok",
  "configuration": {
    "clientId": "1234567890...",
    "hasClientSecret": true,
    "environment": "development",
    "isDevelopment": true,
    "redirectUri": "http://localhost:5174/mercadopago/callback",
    "frontendUrl": "http://localhost:5174",
    "backendUrl": "http://localhost:5000",
    "allFrontendUrls": {
      "foco": "http://localhost:5173",
      "atta": "http://localhost:5174",
      "pulso": "http://localhost:5175"
    }
  },
  "recommendations": [
    "Verifica que la URL de callback esté registrada en el panel de MercadoPago",
    "Development: http://localhost:5174/mercadopago/callback",
    "Production: https://atta.attadia.com/mercadopago/callback"
  ]
}
```

### Logs Detallados

Con los cambios implementados, ahora tienes logs detallados en cada paso del flujo OAuth:

#### Frontend (Consola del navegador):

```
=== [MercadoPago Frontend] Iniciando obtención de URL de autorización ===
🔵 Base URL: /api/bankconnections/mercadopago
🔵 Redirect URI calculado: http://localhost:5174/mercadopago/callback
🔵 Window location: http://localhost:5174/finanzas/cuentas
🔵 Hostname: localhost
🔵 Port: 5174
✅ Respuesta del servidor recibida
✅ Has authUrl: true
✅ Has state: true
✅ AuthURL (primeros 100 chars): https://auth.mercadopago.com/authorization?client_id=...
```

#### Backend (Terminal del servidor):

```
=== [MercadoPago OAuth] Generando URL de autorización ===
Client ID: 123456789...
Redirect URI recibido: http://localhost:5174/mercadopago/callback
Environment: development
Frontend URL: http://localhost:5174
✅ URL de autorización generada correctamente
State generado: abc123def4...
Scopes solicitados: read offline_access write
```

## Errores Comunes y Soluciones

### Error: Página de error en MercadoPago (antes del callback)

**Síntomas:**
- Al hacer click en "Sync", redirige a MercadoPago pero muestra una página de error
- No llega al callback de tu aplicación

**Causas posibles:**

1. **redirect_uri no registrado**
   - Solución: Registra la URL exacta en el panel de MercadoPago
   - Panel: https://www.mercadopago.com.ar/developers/panel/app
   - Sección: "Redirect URIs" (NO Webhooks)

2. **client_id inválido**
   - Verifica que `MERCADOPAGO_CLIENT_ID` esté correctamente configurado
   - Usa el endpoint de diagnóstico para verificar

3. **Mismatch entre URLs**
   - La URL que calculas en frontend debe coincidir exactamente con:
     - La que usas en backend
     - La registrada en MercadoPago
   - Usa los logs para comparar

### Error 405: Method Not Allowed

**Causa:**
- Estás intentando configurar la URL base en la sección de Webhooks
- Webhooks esperan POST, pero la URL base es una aplicación React (GET)

**Solución:**
- Ve a la sección "Redirect URIs" (NO Webhooks)
- Configura: `https://atta.attadia.com/mercadopago/callback`
- NO uses: `https://atta.attadia.com`

### Error 400: redirect_uri inválido

**Causa:**
- El redirect_uri enviado a MercadoPago no coincide con los registrados

**Solución:**
1. Revisa los logs del backend para ver la URL exacta generada
2. Verifica que esa URL esté registrada en MercadoPago
3. Asegúrate de incluir el protocolo (http:// o https://)
4. En desarrollo, incluye el puerto (5174)

### Error 400: state inválido

**Causa:**
- El parámetro `state` expiró (válido por 5 minutos)
- Problema de sesiones entre frontend y backend
- Usuario tardó mucho en autorizar

**Solución:**
1. Intenta nuevamente (el state se regenera)
2. Verifica que las cookies estén habilitadas
3. En desarrollo, verifica que frontend y backend compartan dominio

### Modal de Sync siempre inicia OAuth

**Antes:**
- El modal siempre mostraba el botón de conectar, incluso si ya había conexiones

**Ahora:**
- El modal detecta conexiones existentes
- Si hay conexiones: muestra botón "Sincronizar Transacciones"
- Si no hay conexiones: muestra botón "Conectar con MercadoPago"
- Permite agregar múltiples cuentas

## Flujo Completo Mejorado

### 1. Primera Vez (OAuth Inicial)

```
Usuario → Click "Sync"
  ↓
Modal verifica conexiones → No hay
  ↓
Muestra botón "Conectar con MercadoPago"
  ↓
Click botón → Frontend solicita authUrl
  ↓
Backend genera URL con redirect_uri
  ↓
Frontend redirige a MercadoPago
  ↓
Usuario autoriza
  ↓
MercadoPago redirige al callback
  ↓
Frontend envía code al backend
  ↓
Backend crea cuenta y conexión
  ↓
Usuario ve su cuenta sincronizada
```

### 2. Sincronizaciones Posteriores

```
Usuario → Click "Sync"
  ↓
Modal verifica conexiones → Hay conexión(es)
  ↓
Muestra lista de conexiones con botón "Sincronizar Transacciones"
  ↓
Click botón → POST /api/bankconnections/sync/{id}
  ↓
Backend sincroniza transacciones (usa tokens guardados)
  ↓
Actualiza balances y muestra notificación
```

## Checklist de Verificación

Antes de probar el flujo, verifica:

- [ ] `MERCADOPAGO_CLIENT_ID` configurado en backend
- [ ] `MERCADOPAGO_CLIENT_SECRET` configurado en backend
- [ ] Redirect URI registrado en panel de MercadoPago para desarrollo: `http://localhost:5174/mercadopago/callback`
- [ ] Redirect URI registrado en panel de MercadoPago para producción: `https://atta.attadia.com/mercadopago/callback`
- [ ] Backend corriendo en el puerto correcto (5000 por defecto)
- [ ] Frontend corriendo en el puerto correcto (5174 para Atta)
- [ ] Cookies habilitadas en el navegador
- [ ] Endpoint de diagnóstico responde correctamente

## Testing

### 1. Verificar Configuración

```bash
# Debe responder con configuración válida
curl http://localhost:5000/api/bankconnections/mercadopago/diagnostico
```

### 2. Probar Flujo OAuth

1. Abre: http://localhost:5174/finanzas/cuentas
2. Click en botón "Sync" o equivalente
3. Observa los logs en consola del navegador
4. Verifica que la URL de redirect_uri sea correcta
5. Click en "Conectar con MercadoPago"
6. Observa los logs del backend en terminal
7. Serás redirigido a MercadoPago
8. Autoriza la aplicación
9. Serás redirigido de vuelta a Atta
10. Deberías ver un mensaje de éxito
11. Tu cuenta debería aparecer en la lista

### 3. Probar Sincronización

1. Abre nuevamente el modal de Sync
2. Deberías ver tu conexión listada
3. Click en "Sincronizar Transacciones"
4. Observa los logs del backend
5. Deberías ver un mensaje de éxito
6. Los balances deberían actualizarse

## Cambios Implementados

### Backend

1. **Endpoint de diagnóstico**: `GET /api/bankconnections/mercadopago/diagnostico`
2. **Logs detallados** en:
   - `bankConnectionController.js` (getMercadoPagoAuthUrl, mercadoPagoCallback)
   - `mercadoPagoOAuth.js` (getAuthUrl, exchangeCodeForToken)
3. **Documentación**: `MERCADOPAGO_SETUP.md`

### Frontend

1. **Logs detallados** en `mercadopagoService.js`
2. **Lógica mejorada de modal** en `Cuentas.jsx`:
   - Detecta conexiones existentes
   - Muestra opciones de sincronización si hay conexiones
   - Permite agregar múltiples cuentas
3. **Bug fix**: Corrección de render en `MercadoPagoCallbackPage.jsx`
4. **Documentación**: Este archivo de troubleshooting

## Soporte

Si después de seguir esta guía sigues teniendo problemas:

1. Copia los logs del frontend (consola del navegador)
2. Copia los logs del backend (terminal)
3. Copia la respuesta del endpoint de diagnóstico
4. Incluye esta información al reportar el problema

