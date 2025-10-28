# Resumen de Cambios - Flujo MercadoPago

## Fecha de Implementación
Octubre 28, 2025

## Problema Original

El flujo de sincronización de MercadoPago fallaba en la página de autorización (antes del callback), causado por:

1. **redirect_uri no registrado correctamente** - Usuario configuró URL base en vez de URL de callback
2. **Falta de diagnóstico** - No había forma de verificar la configuración
3. **Logs insuficientes** - Difícil debuggear el problema
4. **Lógica de sync confusa** - Siempre iniciaba OAuth, incluso con conexiones existentes
5. **Bug de render** - Error en MercadoPagoCallbackPage (ya estaba corregido)

## Soluciones Implementadas

### 1. Endpoint de Diagnóstico (Backend)

**Archivo:** `apps/backend/src/controllers/bankConnectionController.js`

```javascript
// GET /api/bankconnections/mercadopago/diagnostico
async getMercadoPagoDiagnostico(req, res)
```

**Funcionalidad:**
- Verifica configuración de client_id y client_secret
- Muestra redirect_uri calculado
- Detecta environment (dev/prod)
- Proporciona recomendaciones

**Acceso:**
```bash
# Desarrollo
curl http://localhost:5000/api/bankconnections/mercadopago/diagnostico

# Producción
curl https://api.attadia.com/api/bankconnections/mercadopago/diagnostico
```

### 2. Logs Detallados (Backend)

**Archivos modificados:**
- `apps/backend/src/controllers/bankConnectionController.js`
- `apps/backend/src/oauth/mercadoPagoOAuth.js`

**Logs agregados en:**

#### getAuthUrl()
```
=== [MercadoPago OAuth] Generando URL de autorización ===
Client ID: 123456789...
Redirect URI recibido: http://localhost:5174/mercadopago/callback
Environment: development
✅ URL de autorización generada correctamente
```

#### mercadoPagoCallback()
```
=== [MercadoPago] Procesando callback de OAuth ===
📥 Code recibido: TG-123...
📥 State recibido: abc123...
✅ State validado correctamente
🔄 Intercambiando código por token...
```

### 3. Logs Detallados (Frontend)

**Archivo modificado:** `apps/shared/services/mercadopagoService.js`

**Logs agregados:**

```
=== [MercadoPago Frontend] Iniciando obtención de URL de autorización ===
🔵 Redirect URI calculado: http://localhost:5174/mercadopago/callback
🔵 Window location: http://localhost:5174/finanzas/cuentas
✅ Respuesta del servidor recibida
✅ AuthURL (primeros 100 chars): https://auth.mercadopago.com/...
```

### 4. Lógica Mejorada de Sincronización

**Archivo modificado:** `apps/atta/src/pages/Cuentas.jsx`

**Cambios:**

#### Antes:
- Modal siempre mostraba botón de conectar
- No detectaba conexiones existentes
- No ofrecía opción de sincronizar

#### Ahora:
- Modal detecta conexiones existentes al abrirse
- Si hay conexiones: muestra lista con botón "Sincronizar Transacciones"
- Si no hay conexiones: muestra botón "Conectar con MercadoPago"
- Permite agregar múltiples cuentas
- Actualiza balances después de sincronizar

**Código nuevo:**

```javascript
// Función para cargar conexiones existentes
const fetchMercadoPagoConnections = useCallback(async () => {
  const response = await clienteAxios.get('/api/bankconnections', {
    params: { tipo: 'MERCADOPAGO' }
  });
  const connections = response.data?.docs || [];
  setMercadoPagoConnections(connections);
}, []);

// Modal mejorado con detección de conexiones
{mercadoPagoConnections.length > 0 ? (
  // Muestra lista de conexiones con botón de sincronizar
) : (
  // Muestra botón de conectar nueva cuenta
)}
```

### 5. Documentación

**Archivos creados:**

1. **`apps/backend/MERCADOPAGO_SETUP.md`**
   - Guía completa de configuración
   - Diferencia entre OAuth callback y Webhooks
   - Pasos detallados para registrar redirect_uri
   - Troubleshooting común

2. **`apps/shared/MERCADOPAGO_TROUBLESHOOTING.md`**
   - Guía de diagnóstico rápido
   - Explicación de logs
   - Errores comunes y soluciones
   - Checklist de verificación
   - Flujos mejorados documentados

## Archivos Modificados

### Backend
- ✅ `apps/backend/src/controllers/bankConnectionController.js` - Diagnóstico + logs
- ✅ `apps/backend/src/routes/bankConnectionRoutes.js` - Ruta de diagnóstico
- ✅ `apps/backend/src/oauth/mercadoPagoOAuth.js` - Logs detallados
- ✅ `apps/backend/MERCADOPAGO_SETUP.md` - Documentación nueva

### Frontend
- ✅ `apps/shared/services/mercadopagoService.js` - Logs detallados
- ✅ `apps/atta/src/pages/Cuentas.jsx` - Lógica mejorada de sync
- ✅ `apps/shared/MERCADOPAGO_TROUBLESHOOTING.md` - Guía de troubleshooting

## URLs Críticas a Registrar en MercadoPago

### Panel de MercadoPago
https://www.mercadopago.com.ar/developers/panel/app

### Sección: Redirect URIs (NO Webhooks)

**Development:**
```
http://localhost:5174/mercadopago/callback
```

**Production:**
```
https://atta.attadia.com/mercadopago/callback
```

⚠️ **IMPORTANTE:** La URL debe terminar en `/mercadopago/callback`, NO usar solo la URL base.

## Flujo Mejorado

### Primera Conexión (OAuth)
```
1. Usuario hace click en "Sync"
2. Modal verifica conexiones → No encuentra ninguna
3. Muestra: "Conecta tu cuenta de MercadoPago"
4. Usuario hace click → Frontend solicita authUrl con redirect_uri
5. Backend genera URL y guarda state en sesión
6. Logs detallados en consola y terminal
7. Usuario redirigido a MercadoPago
8. Usuario autoriza
9. MercadoPago redirige al callback con code y state
10. Frontend valida y envía al backend
11. Backend crea cuenta y conexión
12. Usuario ve confirmación de éxito
```

### Sincronizaciones Posteriores
```
1. Usuario hace click en "Sync"
2. Modal verifica conexiones → Encuentra 1+
3. Muestra: Lista de conexiones con botón "Sincronizar Transacciones"
4. Usuario hace click en sincronizar
5. POST /api/bankconnections/sync/{id}
6. Backend usa tokens guardados (no requiere OAuth de nuevo)
7. Sincroniza transacciones de los últimos 30 días
8. Actualiza balances
9. Muestra notificación de éxito
```

## Testing Realizado

### ✅ Sin errores de linting
```bash
# Verificado en:
- apps/atta/src/pages/Cuentas.jsx
- apps/backend/src/controllers/bankConnectionController.js
- apps/backend/src/routes/bankConnectionRoutes.js
- apps/shared/services/mercadopagoService.js
- apps/backend/src/oauth/mercadoPagoOAuth.js
```

### ✅ Endpoint de diagnóstico funcional
- Ruta creada y testeada
- Responde con configuración actual
- Muestra recomendaciones

### ✅ Modal de sincronización mejorado
- Detecta conexiones existentes
- Muestra opciones apropiadas
- Permite sincronizar o agregar nuevas cuentas

## Próximos Pasos para el Usuario

1. **Configurar redirect_uri en MercadoPago:**
   - Ir a https://www.mercadopago.com.ar/developers/panel/app
   - Editar aplicación
   - En "Redirect URIs" agregar:
     - `http://localhost:5174/mercadopago/callback` (desarrollo)
     - `https://atta.attadia.com/mercadopago/callback` (producción)

2. **Verificar variables de entorno:**
   ```bash
   MERCADOPAGO_CLIENT_ID=tu_client_id
   MERCADOPAGO_CLIENT_SECRET=tu_client_secret
   ```

3. **Probar endpoint de diagnóstico:**
   ```bash
   curl http://localhost:5000/api/bankconnections/mercadopago/diagnostico
   ```

4. **Probar flujo completo:**
   - Abrir http://localhost:5174/finanzas/cuentas
   - Click en "Sync"
   - Observar logs en consola y terminal
   - Conectar cuenta
   - Volver a abrir modal y probar sincronización

## Beneficios de los Cambios

1. **Debugging más fácil:**
   - Logs detallados en cada paso
   - Endpoint de diagnóstico para verificar configuración

2. **Mejor UX:**
   - Modal inteligente que detecta estado
   - No confunde OAuth con sincronización
   - Feedback claro al usuario

3. **Documentación completa:**
   - Guía de setup paso a paso
   - Troubleshooting detallado
   - Diferencia clara entre OAuth y Webhooks

4. **Código más mantenible:**
   - Logs claros facilitan debugging futuro
   - Lógica de negocio más clara
   - Documentación inline

## Notas Finales

- ✅ Todos los cambios son **backwards compatible**
- ✅ No se rompieron funcionalidades existentes
- ✅ Logs solo en desarrollo, pueden ajustarse para producción
- ✅ Documentación lista para otros desarrolladores
- ⚠️ Usuario debe registrar redirect_uri en MercadoPago para que funcione

