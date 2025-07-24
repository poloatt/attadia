# Guía de Integración de MercadoPago - Versión Mejorada

## Descripción General

Esta es la versión mejorada de la integración con MercadoPago que incluye mejor manejo de errores, validación de seguridad, timeouts configurables y funcionalidades adicionales para la gestión completa de datos.

## Arquitectura Mejorada

### 1. Servicio Principal (`mercadopagoService.js`)

#### Nuevas Funcionalidades:
- **Timeouts configurables** por tipo de operación
- **Validación de state** con expiración automática (5 minutos)
- **Manejo de errores específicos** por código de estado HTTP
- **Métodos adicionales** para gestión completa de datos
- **Gestión de estado de conexión** en localStorage

#### Métodos Disponibles:

```javascript
// Conexión OAuth
await mercadopagoService.getAuthUrl()           // Obtiene URL de autorización
await mercadopagoService.processCallback(code, state)  // Procesa callback
await mercadopagoService.connect()              // Inicia flujo de conexión

// Gestión de conexiones
await mercadopagoService.syncConnection(connectionId, options)  // Sincroniza
await mercadopagoService.verifyConnection(connectionId)        // Verifica estado
await mercadopagoService.getCompleteData(connectionId, options) // Obtiene datos completos
await mercadopagoService.processData(connectionId, options)    // Procesa datos

// Utilidades
mercadopagoService.validateState(receivedState)  // Valida state
mercadopagoService.clearState()                  // Limpia state
mercadopagoService.getConnectionStatus()         // Obtiene estado
```

### 2. Hook Personalizado (`useMercadoPago.js`)

#### Estados Adicionales:
- `processing`: Estado de procesamiento de datos
- `connectionStatus`: Estado actual de la conexión

#### Nuevos Métodos:
```javascript
const {
  loading,
  connecting,
  processing,
  connectionStatus,
  connect,
  processCallback,
  syncConnection,
  verifyConnection,
  getCompleteData,
  processData,
  validateState,
  clearState,
  getConnectionStatus
} = useMercadoPago();
```

### 3. Componentes Mejorados

#### MercadoPagoStatusIndicator
Muestra el estado de la conexión con indicadores visuales:
- ✅ Conectado
- 🔄 Conectando
- ⏸️ Desconectado
- ❌ Error

#### MercadoPagoConnectionManager
Gestión completa de conexiones con:
- Diálogos de configuración
- Opciones de sincronización
- Procesamiento de datos
- Indicadores de estado en tiempo real

## Ejemplos de Uso

### 1. Conexión Básica

```jsx
import { useMercadoPago } from '../hooks/useMercadoPago';

function MyComponent() {
  const { connect, connecting } = useMercadoPago();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error de conexión:', error.message);
    }
  };

  return (
    <Button 
      onClick={handleConnect} 
      disabled={connecting}
      variant="contained"
    >
      {connecting ? 'Conectando...' : 'Conectar MercadoPago'}
    </Button>
  );
}
```

### 2. Gestión Completa de Conexión

```jsx
import MercadoPagoConnectionManager from '../components/finance/bankconnections/MercadoPagoConnectionManager';

function CuentasPage() {
  const [connectionId, setConnectionId] = useState(null);

  const handleConnectionUpdate = (data) => {
    console.log('Conexión actualizada:', data);
    // Actualizar estado local si es necesario
  };

  return (
    <div>
      <MercadoPagoConnectionManager 
        connectionId={connectionId}
        onConnectionUpdate={handleConnectionUpdate}
      />
    </div>
  );
}
```

### 3. Sincronización Personalizada

```jsx
import { useMercadoPago } from '../hooks/useMercadoPago';

function SyncComponent({ connectionId }) {
  const { syncConnection, loading } = useMercadoPago();

  const handleCustomSync = async () => {
    try {
      const result = await syncConnection(connectionId, {
        force: true,
        since: '2024-01-01'
      });
      console.log('Sincronización completada:', result);
    } catch (error) {
      console.error('Error de sincronización:', error.message);
    }
  };

  return (
    <Button 
      onClick={handleCustomSync} 
      disabled={loading}
    >
      Sincronizar desde 2024
    </Button>
  );
}
```

### 4. Procesamiento de Datos

```jsx
import { useMercadoPago } from '../hooks/useMercadoPago';

function DataProcessor({ connectionId }) {
  const { processData, processing } = useMercadoPago();

  const handleProcessPagos = async () => {
    try {
      const result = await processData(connectionId, {
        procesarPagos: true,
        procesarMovimientos: false
      });
      console.log('Pagos procesados:', result);
    } catch (error) {
      console.error('Error procesando pagos:', error.message);
    }
  };

  return (
    <Button 
      onClick={handleProcessPagos} 
      disabled={processing}
    >
      {processing ? 'Procesando...' : 'Procesar Solo Pagos'}
    </Button>
  );
}
```

## Configuración de Timeouts

Los timeouts están configurados según el tipo de operación:

```javascript
// En mercadopagoService.js
this.timeout = 30000; // 30 segundos base

// Operaciones específicas:
- getAuthUrl(): 30s
- processCallback(): 30s
- syncConnection(): 60s (2x)
- getCompleteData(): 90s (3x)
- processData(): 120s (4x)
```

## Manejo de Errores

### Códigos de Error Específicos:

```javascript
// 400 - Código de autorización inválido o expirado
// 401 - No autorizado (credenciales incorrectas)
// 403 - Sin permisos para acceder a datos
// 404 - Conexión no encontrada
// 409 - Conflicto (conexión ya existe o datos en procesamiento)
// 423 - Conexión bloqueada
// 503 - Servicio temporalmente no disponible
// ECONNABORTED - Timeout del servidor
```

### Ejemplo de Manejo de Errores:

```jsx
const handleOperation = async () => {
  try {
    await mercadopagoService.syncConnection(connectionId);
  } catch (error) {
    switch (error.message) {
      case 'Conexión no encontrada':
        // Manejar conexión perdida
        break;
      case 'Conexión bloqueada':
        // Solicitar nueva autorización
        break;
      case 'Timeout: El servidor no respondió':
        // Reintentar operación
        break;
      default:
        // Error genérico
        console.error('Error:', error.message);
    }
  }
};
```

## Validación de Seguridad

### State Validation:
- El parámetro `state` se valida automáticamente
- Expiración automática después de 5 minutos
- Limpieza automática en caso de error

```javascript
// Validación automática en processCallback
if (!mercadopagoService.validateState(state)) {
  throw new Error('Error de seguridad: parámetro state inválido o expirado');
}
```

## Mejores Prácticas

### 1. Manejo de Estados
```jsx
// Usar los estados del hook para UI
const { loading, connecting, processing, connectionStatus } = useMercadoPago();

// Mostrar indicadores apropiados
{loading && <CircularProgress />}
{connectionStatus === 'connected' && <SuccessIcon />}
```

### 2. Limpieza de Recursos
```jsx
useEffect(() => {
  return () => {
    // Limpiar state al desmontar componente
    mercadopagoService.clearState();
  };
}, []);
```

### 3. Manejo de Reconexión
```jsx
const handleReconnect = async () => {
  mercadopagoService.clearState();
  await connect();
};
```

## Configuración de Ambiente

### URLs de Redirección:
```javascript
// En config/mercadopago.js
redirectURIs: {
  development: 'http://localhost:5173/mercadopago/callback',
  staging: 'https://staging.present.attadia.com/mercadopago/callback',
  production: 'https://admin.attadia.com/mercadopago/callback'
}
```

### Variables de Entorno:
```bash
# Backend
MERCADOPAGO_CLIENT_ID=tu_client_id
MERCADOPAGO_CLIENT_SECRET=tu_client_secret
MERCADOPAGO_REDIRECT_URI=https://tu-dominio.com/mercadopago/callback

# Frontend (opcional)
VITE_MERCADOPAGO_ENABLED=true
```

## Troubleshooting

### Problemas Comunes:

1. **"Código de autorización inválido"**
   - Verificar que el código no haya expirado
   - Revisar configuración de redirect URI

2. **"State validation failed"**
   - El state expiró (5 minutos)
   - Limpiar localStorage y reintentar

3. **"Timeout del servidor"**
   - Verificar conectividad
   - Reintentar operación
   - Verificar configuración de timeouts

4. **"Conexión bloqueada"**
   - Verificar estado de cuenta MercadoPago
   - Solicitar nueva autorización

### Logs de Debug:
```javascript
// Habilitar logs detallados
console.log('MercadoPago Debug:', {
  connectionStatus: mercadopagoService.getConnectionStatus(),
  hasState: !!localStorage.getItem('mercadopago_state'),
  stateTimestamp: localStorage.getItem('mercadopago_state_timestamp')
});
```

## Migración desde Versión Anterior

### Cambios Principales:
1. **Nuevos métodos** en el servicio
2. **Estados adicionales** en el hook
3. **Validación mejorada** de state
4. **Timeouts configurables**
5. **Manejo de errores específicos**

### Compatibilidad:
- Los métodos existentes siguen funcionando
- Nuevas funcionalidades son opcionales
- No hay breaking changes

## Soporte

Para problemas o preguntas sobre la integración:
1. Revisar logs del navegador
2. Verificar configuración de ambiente
3. Consultar documentación de MercadoPago
4. Revisar códigos de error específicos 