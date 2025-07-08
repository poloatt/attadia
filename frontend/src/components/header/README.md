# Header Modular

Esta carpeta contiene la implementación modular del Header de la aplicación, siguiendo el principio de responsabilidad única y manteniendo el estilo geométrico.

## Estructura

```
header/
├── index.js                 # Exportaciones centralizadas
├── Header.jsx              # Componente principal del header
├── HeaderActions.jsx       # Hook personalizado para lógica de acciones
├── HeaderMenuButton.jsx    # Botón del menú lateral
├── HeaderVisibilityButton.jsx # Botón de visibilidad de valores
├── HeaderUndoMenu.jsx      # Menú de deshacer acciones
├── HeaderAddButton.jsx     # Botón de agregar entidades
├── HeaderRefreshButton.jsx # Botón de recargar aplicación
└── README.md              # Esta documentación
```

## Componentes

### Header.jsx
Componente principal que orquesta todos los elementos del header. Mantiene el estilo geométrico y la estructura visual.

### HeaderActions.jsx
Hook personalizado que contiene toda la lógica de configuración de acciones por ruta:
- Configuración de rutas para visibilidad
- Configuración de entidades por ruta
- Mapeo de títulos de rutas
- Lógica de mostrar/ocultar botones

### HeaderMenuButton.jsx
Botón para abrir/cerrar el menú lateral. Solo se muestra cuando el sidebar está habilitado.

### HeaderVisibilityButton.jsx
Botón para mostrar/ocultar valores en las páginas que lo soportan.

### HeaderUndoMenu.jsx
Componente que maneja tanto el botón de deshacer como el menú de historial de acciones.

### HeaderAddButton.jsx
Botón para agregar nuevas entidades. Se muestra solo cuando el EntityToolbar está oculto.

### HeaderRefreshButton.jsx
Botón para recargar la aplicación.

## Beneficios de esta estructura

1. **Separación de responsabilidades**: Cada componente tiene una función específica
2. **Mantenibilidad**: Es más fácil modificar o agregar funcionalidades
3. **Reutilización**: Los componentes pueden ser reutilizados en otros contextos
4. **Testabilidad**: Cada componente puede ser testeado de forma independiente
5. **Legibilidad**: El código es más fácil de entender y navegar

## Uso

```jsx
import { Header } from './components/header';

// En tu componente
<Header />
```

## Configuración de rutas

Para agregar una nueva ruta o modificar el comportamiento, edita `HeaderActions.jsx`:

```jsx
// Agregar nueva ruta para visibilidad
const VISIBILITY_ROUTES = [
  '/nueva-ruta',
  // ... otras rutas
];

// Agregar nueva entidad
const ENTITY_CONFIGS = {
  nuevaEntidad: {
    name: 'nueva entidad',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'nueva-entidad', path: '/nueva-entidad' }
      }));
    }
  }
};
``` 