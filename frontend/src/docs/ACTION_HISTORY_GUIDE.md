# Guía del Sistema de Historial de Acciones

## Descripción General

El sistema de historial de acciones permite a los usuarios deshacer cualquier acción realizada en la aplicación (crear, editar, eliminar, mover registros). El historial se mantiene centralizado y persistente en localStorage.

## Características Principales

- ✅ **Historial Global**: Todas las acciones se registran en un contexto central
- ✅ **Persistencia**: El historial se guarda en localStorage y sobrevive a recargas
- ✅ **Interfaz Intuitiva**: Botón de deshacer en el header con badge y menú desplegable
- ✅ **Acciones Específicas**: Cada entidad puede manejar sus propias reversiones
- ✅ **Límite Configurable**: Máximo 50 acciones en el historial (configurable)
- ✅ **Tipos de Acción**: CREATE, UPDATE, DELETE, MOVE, BULK_DELETE, BULK_UPDATE
- ✅ **Implementación Automática**: No necesitas importar en cada página individualmente

## 🎯 **MEJOR PRÁCTICA: Implementación Automática**

**NO necesitas importar el sistema en cada página individualmente.** La mejor práctica es usar el hook `usePageWithHistory` que detecta automáticamente la entidad basada en la ruta.

### Implementación Automática (Recomendada)

```jsx
// En cualquier página (ej: Tareas.jsx, Proyectos.jsx, etc.)
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';

export function MiPagina() {
  // El sistema detecta automáticamente la entidad basada en la ruta
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
    // Función para recargar datos
    async () => {
      await fetchData();
    },
    // Función para manejar errores
    (error) => {
      console.error('Error al revertir:', error);
      enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
    }
  );

  // Usar las funciones automáticamente
  const handleCreate = async (data) => {
    await createWithHistory(data); // ✅ Historial automático
  };

  const handleUpdate = async (id, updates, originalData) => {
    await updateWithHistory(id, updates, originalData); // ✅ Historial automático
  };

  const handleDelete = async (id) => {
    await deleteWithHistory(id); // ✅ Historial automático
  };
}
```

### Ventajas de la Implementación Automática

1. **🚀 Zero Configuración**: No necesitas configurar nada manualmente
2. **🎯 Detección Automática**: El sistema detecta la entidad basada en la ruta
3. **🔄 Manejo Automático**: Los eventos de deshacer se manejan automáticamente
4. **🧹 Código Limpio**: Elimina código repetitivo
5. **📱 Consistencia**: Mismo comportamiento en todas las páginas

## Componentes del Sistema

### 1. ActionHistoryContext
Contexto global que maneja el estado del historial.

```jsx
import { ActionHistoryProvider } from '../context/ActionHistoryContext';

// Envuelve tu app
<ActionHistoryProvider>
  <App />
</ActionHistoryProvider>
```

### 2. Header Mejorado
El header ahora incluye:
- Botón de deshacer con badge mostrando el número de acciones
- Botón de historial con menú desplegable
- Iconos específicos para cada tipo de acción

### 3. Hooks Automáticos

#### usePageWithHistory (Recomendado)
Hook que detecta automáticamente la entidad y proporciona todo lo necesario.

```jsx
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';

const { 
  isSupported,
  createWithHistory, 
  updateWithHistory, 
  deleteWithHistory 
} = usePageWithHistory(fetchData, handleError);
```

#### useGlobalActionHistory
Hook básico que detecta la entidad automáticamente.

```jsx
import { useGlobalActionHistory } from '../hooks/useGlobalActionHistory';

const { 
  isSupported,
  entity,
  createWithHistory, 
  updateWithHistory, 
  deleteWithHistory 
} = useGlobalActionHistory();
```

#### useActionHistoryManager (Avanzado)
Hook básico para manejar acciones de una entidad específica.

```jsx
import { useActionHistoryManager } from '../hooks/useActionHistory';

const { 
  addCreateAction, 
  addUpdateAction, 
  addDeleteAction,
  addMoveAction,
  getCommonActions 
} = useActionHistoryManager('proyecto');
```

#### useCRUDWithHistory (Avanzado)
Hook avanzado que combina CRUD con historial automático.

```jsx
import { useCRUDWithHistory } from '../hooks/useActionHistory';

const apiService = {
  create: (data) => axios.post('/api/proyectos', data),
  update: (id, data) => axios.put(`/api/proyectos/${id}`, data),
  delete: (id) => axios.delete(`/api/proyectos/${id}`),
  getById: (id) => axios.get(`/api/proyectos/${id}`)
};

const { 
  createWithHistory, 
  updateWithHistory, 
  deleteWithHistory 
} = useCRUDWithHistory('proyecto', apiService);
```

## Implementación en un Componente

### Paso 1: Usar el Hook Automático

```jsx
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';

export function MiComponente() {
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
    async () => {
      await fetchData();
    },
    (error) => {
      enqueueSnackbar('Error al revertir', { variant: 'error' });
    }
  );
}
```

### Paso 2: Usar las Funciones con Historial

```jsx
// Crear con historial automático
const handleCreate = async (data) => {
  try {
    await createWithHistory(data);
    // La acción se registra automáticamente
  } catch (error) {
    console.error('Error:', error);
  }
};

// Actualizar con historial automático
const handleUpdate = async (id, updates, originalData) => {
  try {
    await updateWithHistory(id, updates, originalData);
    // La acción se registra automáticamente
  } catch (error) {
    console.error('Error:', error);
  }
};

// Eliminar con historial automático
const handleDelete = async (id) => {
  try {
    await deleteWithHistory(id);
    // La acción se registra automáticamente
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Paso 3: ¡Listo! No necesitas más pasos

El sistema maneja automáticamente:
- ✅ Registro de acciones
- ✅ Eventos de deshacer
- ✅ Reversión de acciones
- ✅ Recarga de datos
- ✅ Manejo de errores

## Estructura de una Acción

```jsx
{
  id: "timestamp_random", // ID único
  type: "CREATE|UPDATE|DELETE|MOVE", // Tipo de acción
  entity: "proyecto", // Entidad afectada
  data: {...}, // Datos actuales (null para DELETE)
  originalData: {...}, // Datos originales (null para CREATE)
  description: "Crear proyecto 'Mi Proyecto'", // Descripción legible
  entityId: "proyecto_id", // ID de la entidad
  timestamp: "2024-01-01T12:00:00.000Z", // Timestamp ISO
  createdAt: 1704110400000 // Timestamp numérico
}
```

## Configuración Avanzada

### Personalizar Descripciones

```jsx
// En lugar de usar la descripción automática
addCreateAction(data, `Crear proyecto "${data.nombre}"`);

// O con más contexto
addUpdateAction(newData, originalData, `Cambiar estado de "${newData.nombre}" de ${originalData.estado} a ${newData.estado}`);
```

### Acciones Personalizadas

```jsx
import { ACTION_TYPES } from '../context/ActionHistoryContext';

addCustomAction(
  ACTION_TYPES.MOVE,
  movedData,
  originalData,
  `Mover tarea "${movedData.titulo}" de "${fromProject}" a "${toProject}"`
);
```

### Configurar Opciones

```jsx
const { addCreateAction } = useActionHistoryManager('proyecto', {
  maxActions: 20, // Máximo 20 acciones para esta entidad
  autoListen: false // No escuchar eventos automáticamente
});
```

## Mejores Prácticas

### 1. Usar el Hook Automático
```jsx
// ✅ Recomendado
const { createWithHistory, updateWithHistory, deleteWithHistory } = usePageWithHistory(fetchData, handleError);

// ❌ No recomendado
const { addAction } = useActionHistory();
```

### 2. Manejar Errores
```jsx
try {
  await createWithHistory(data);
} catch (error) {
  // El historial no se registra si hay error
  console.error('Error:', error);
}
```

### 3. Recargar Datos Después de Revertir
```jsx
// ✅ Se maneja automáticamente con usePageWithHistory
const { createWithHistory } = usePageWithHistory(async () => {
  await fetchData(); // Se ejecuta automáticamente después de revertir
});
```

### 4. Usar Descripciones Descriptivas
```jsx
// ✅ Bueno
addUpdateAction(newData, originalData, `Cambiar prioridad de "${newData.nombre}"`);

// ❌ Malo
addUpdateAction(newData, originalData, "Actualizar proyecto");
```

## Entidades Soportadas Automáticamente

- `proyecto` → `/proyectos`
- `tarea` → `/tareas`
- `propiedad` → `/propiedades`
- `transaccion` → `/transacciones`
- `cuenta` → `/cuentas`
- `moneda` → `/monedas`
- `rutina` → `/rutinas`
- `inquilino` → `/inquilinos`
- `contrato` → `/contratos`
- `habitacion` → `/habitaciones`
- `inventario` → `/inventario`
- `transaccion_recurrente` → `/recurrente`

## Limitaciones

1. **Persistencia**: El historial se pierde al limpiar localStorage
2. **Límite**: Máximo 50 acciones (configurable)
3. **Concurrencia**: No maneja acciones simultáneas de múltiples usuarios
4. **Complejidad**: Algunas acciones complejas pueden requerir lógica personalizada

## Troubleshooting

### El botón de deshacer no aparece
- Verificar que la ruta esté en `showUndoButton` en Header.jsx
- Verificar que `canUndo()` retorne true
- Verificar que la ruta esté mapeada en `ROUTE_ENTITY_MAP`

### Las acciones no se registran
- Verificar que el componente use `usePageWithHistory`
- Verificar que no haya errores en la consola
- Verificar que el ActionHistoryProvider esté envolviendo la app

### Las reversiones no funcionan
- Verificar que la función `fetchData` esté pasada correctamente a `usePageWithHistory`
- Verificar que la API esté funcionando
- Verificar que la entidad esté mapeada correctamente

### El historial se pierde al recargar
- Verificar que localStorage esté habilitado
- Verificar que no haya errores de JSON.parse
- Verificar el tamaño del historial (puede exceder límites de localStorage)

## Migración desde Implementación Manual

Si ya tienes implementación manual, migrar es fácil:

### ANTES (Implementación Manual)
```jsx
import { useActionHistory } from '../context/ActionHistoryContext';

const { addAction } = useActionHistory();

const handleCreate = async (data) => {
  const response = await axios.post('/api/proyectos', data);
  addAction({
    type: 'proyecto',
    action: 'create',
    entityId: response.data._id,
    currentState: response.data,
    timestamp: new Date().toISOString()
  });
};
```

### DESPUÉS (Implementación Automática)
```jsx
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';

const { createWithHistory } = usePageWithHistory(fetchData, handleError);

const handleCreate = async (data) => {
  await createWithHistory(data); // ✅ Todo automático
};
``` 