# EntityGridView

Un componente reutilizable para mostrar datos en formato de grid con estética geométrica minimalista, basado en el diseño de `PropiedadGridView.jsx`.

## Características

- **Estética geométrica**: Bordes rectos, sin bordes redondeados
- **Hover effects**: Información adicional al pasar el mouse
- **Paginación automática**: Para listas largas con slots fijos
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Configurable**: Sistema de configuración flexible para diferentes tipos de datos
- **Tipos de vista**: Lista de elementos e información estructurada

## Tipos de Vista

### 1. Lista (`type="list"`)
Para mostrar listas de elementos con iconos, títulos y subtítulos.

### 2. Información (`type="info"`)
Para mostrar información estructurada como estadísticas, métricas, etc.

## Configuración

### Para Listas (`type="list"`)

```javascript
const config = {
  getIcon: (item) => IconComponent,        // Función que retorna el componente de icono
  getIconColor: (item) => '#color',        // Función que retorna el color del icono (opcional)
  getTitle: (item) => 'Título',            // Función que retorna el título
  getSubtitle: (item) => 'Subtítulo',      // Función que retorna el subtítulo (opcional)
  getHoverInfo: (item) => 'Info hover',    // Función que retorna info para hover (opcional)
  getLinkTo: (item) => '/ruta',            // Función que retorna la ruta de enlace (opcional)
};
```

### Para Información (`type="info"`)

```javascript
const data = [
  {
    icon: IconComponent,
    label: 'Etiqueta',
    value: 'Valor',
    color: 'primary.main'
  }
];
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `type` | `'list' \| 'info'` | `'list'` | Tipo de vista |
| `data` | `Array` | `[]` | Datos a mostrar |
| `config` | `Object` | `{}` | Configuración para el tipo de vista |
| `title` | `string` | `null` | Título de la sección |
| `isCompact` | `boolean` | `false` | Modo compacto para elementos más pequeños |
| `fixedSlots` | `number` | `null` | Número fijo de slots (para paginación) |
| `itemsPerPage` | `number` | `null` | Elementos por página |
| `gridSize` | `Object` | `{xs: 6, sm: 6, md: 6, lg: 6}` | Tamaño del grid |
| `emptyMessage` | `string` | `"No hay elementos registrados"` | Mensaje cuando no hay datos |

## Ejemplos de Uso

### Lista de Usuarios

```jsx
import EntityGridView from './EntityViews/EntityGridView';
import { Person, CheckCircle, Warning, Error } from '@mui/icons-material';

const usuariosConfig = {
  getIcon: (usuario) => {
    const statusIcons = {
      'ACTIVO': CheckCircle,
      'PENDIENTE': Warning,
      'INACTIVO': Error
    };
    return statusIcons[usuario.estado] || Person;
  },
  getIconColor: (usuario) => {
    const statusColors = {
      'ACTIVO': '#4caf50',
      'PENDIENTE': '#ff9800',
      'INACTIVO': '#f44336'
    };
    return statusColors[usuario.estado] || '#9e9e9e';
  },
  getTitle: (usuario) => `${usuario.nombre} ${usuario.apellido}`,
  getSubtitle: (usuario) => usuario.email,
  getLinkTo: (usuario) => `/usuarios/${usuario._id}`
};

<EntityGridView
  type="list"
  data={usuarios}
  config={usuariosConfig}
  title="Usuarios"
  gridSize={{ xs: 12, sm: 6, md: 4, lg: 3 }}
/>
```

### Información Financiera

```jsx
import { AttachMoney } from '@mui/icons-material';

const datosFinancieros = [
  {
    icon: AttachMoney,
    label: 'Ingresos',
    value: '$50,000',
    color: 'success.main'
  },
  {
    icon: AttachMoney,
    label: 'Gastos',
    value: '$30,000',
    color: 'error.main'
  }
];

<EntityGridView
  type="info"
  data={datosFinancieros}
  title="Resumen Financiero"
  gridSize={{ xs: 12, sm: 6, md: 6, lg: 6 }}
/>
```

### Lista Compacta con Paginación

```jsx
<EntityGridView
  type="list"
  data={habitaciones}
  config={habitacionesConfig}
  title="Habitaciones"
  isCompact={true}
  fixedSlots={8}
  itemsPerPage={8}
  gridSize={{ xs: 3, sm: 3, md: 3, lg: 3 }}
/>
```

## Componentes Exportados

- `EntityGridView`: Componente principal
- `EntityCard`: Componente individual para elementos
- `EntityGrid`: Componente para listas con paginación
- `InfoGrid`: Componente para información estructurada
- `GeometricPaper`: Paper estilizado geométrico
- `CompactPaper`: Paper compacto estilizado
- `GeometricChip`: Chip estilizado geométrico

## Migración desde PropiedadGridView

El componente `PropiedadGridView.jsx` ha sido refactorizado para usar `EntityGridView`. La funcionalidad y apariencia visual se mantienen exactamente iguales, pero ahora el código es más mantenible y reutilizable.

## Estilo Geométrico

El componente sigue las reglas de estilo geométrico:
- Bordes rectos (borderRadius: 0)
- Sin elementos redondeados
- Transiciones suaves
- Colores del tema Material-UI
- Hover effects sutiles 