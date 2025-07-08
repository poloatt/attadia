import { useLocation } from 'react-router-dom';
import { SUPPORTED_ROUTES } from '../../hooks/useGlobalActionHistory';

// Configuración de rutas donde se debe mostrar el botón de visibilidad
const VISIBILITY_ROUTES = [
  '/', // Dashboard
  '/dashboard', // También en la ruta /dashboard
  '/transacciones',
  '/cuentas',
  '/monedas',
  '/proyectos',
  '/tareas',
  '/archivo',
  '/propiedades',
  '/contratos'
];

// Configuración de rutas donde se debe mostrar el botón de agregar
const ADD_BUTTON_ROUTES = [
  '/proyectos',
  '/tareas',
  '/cuentas',
  '/monedas',
  '/rutinas',
  '/inquilinos',
  '/contratos',
  '/habitaciones',
  '/recurrente',
  '/propiedades',
  '/transacciones',
  '/inventario',
  '/data-corporal',
  '/dieta'
];

// Configuración de entidades por ruta
const ENTITY_CONFIGS = {
  proyectos: {
    name: 'proyecto',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'proyecto', path: '/proyectos' }
      }));
    }
  },
  tareas: {
    name: 'tarea',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'tarea', path: '/tareas' }
      }));
    }
  },
  propiedades: {
    name: 'propiedad',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'propiedad', path: '/propiedades' }
      }));
    }
  },
  transacciones: {
    name: 'transacción',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'transaccion', path: '/transacciones' }
      }));
    }
  },
  cuentas: {
    name: 'cuenta',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'cuenta', path: '/cuentas' }
      }));
    }
  },
  monedas: {
    name: 'moneda',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'moneda', path: '/monedas' }
      }));
    }
  },
  rutinas: {
    name: 'rutina',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'rutina', path: '/rutinas' }
      }));
    }
  },
  inquilinos: {
    name: 'inquilino',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'inquilino', path: '/inquilinos' }
      }));
    }
  },
  contratos: {
    name: 'contrato',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'contrato', path: '/contratos' }
      }));
    }
  },
  habitaciones: {
    name: 'habitación',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'habitacion', path: '/habitaciones' }
      }));
    }
  },
  inventario: {
    name: 'inventario',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'inventario', path: '/inventario' }
      }));
    }
  },
  recurrente: {
    name: 'transacción recurrente',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'transaccion-recurrente', path: '/recurrente' }
      }));
    }
  },
  transacciones: {
    name: 'transacción',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'transaccion', path: '/transacciones' }
      }));
    }
  },
  inventario: {
    name: 'inventario',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'inventario', path: '/inventario' }
      }));
    }
  },
  'data-corporal': {
    name: 'dato corporal',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'data-corporal', path: '/data-corporal' }
      }));
    }
  },
  dieta: {
    name: 'dieta',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'dieta', path: '/dieta' }
      }));
    }
  }
};

// Mapeo personalizado de títulos de rutas
const ROUTE_TITLES = {
  '': 'mis assets',          // ruta raíz (Dashboard)
  'dashboard': 'mis assets', // También para la ruta /dashboard
  'rutinas': 'mi salud',
  'tiempo': 'mi tiempo'
};

export const useHeaderActions = () => {
  const location = useLocation();

  const getRouteTitle = () => {
    const path = location.pathname.split('/')[1];
    return ROUTE_TITLES[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  const showVisibilityButton = VISIBILITY_ROUTES.includes(location.pathname);

  const getEntityConfig = () => {
    const path = location.pathname.slice(1); // Elimina el / inicial
    return ENTITY_CONFIGS[path] || null;
  };

  const showAddButton = ADD_BUTTON_ROUTES.includes(location.pathname);

  const showUndoButton = SUPPORTED_ROUTES.some(route => location.pathname.startsWith(route));

  return {
    getRouteTitle,
    showVisibilityButton,
    getEntityConfig,
    showAddButton,
    showUndoButton
  };
}; 