import { useLocation } from 'react-router-dom';
import { SUPPORTED_ROUTES } from '../../hooks/useGlobalActionHistory';

// Configuración de rutas donde se debe mostrar el botón de visibilidad
const VISIBILITY_ROUTES = [
  '/', // Assets
  '/assets', // También en la ruta /assets
  '/assets/finanzas',
  '/assets/finanzas/cuentas',
  '/assets/finanzas/monedas',
  '/tiempo/proyectos',
  '/tiempo/tareas',
  '/tiempo/archivo',
  '/assets/propiedades',
  '/assets/propiedades/contratos'
];

// Configuración de rutas donde se debe mostrar el botón de agregar
const ADD_BUTTON_ROUTES = [
  '/tiempo/proyectos',
  '/tiempo/tareas',
  '/assets/finanzas/cuentas',
  '/assets/finanzas/monedas',
  '/salud/rutinas',
  '/assets/propiedades/inquilinos',
  '/assets/propiedades/contratos',
  '/assets/finanzas/recurrente',
  '/assets/propiedades',
  '/assets/finanzas',
  '/assets/propiedades/inventario',
  '/salud/datacorporal',
  '/salud/dieta'
];

// Configuración de entidades por ruta
const ENTITY_CONFIGS = {
  'tiempo/proyectos': {
    name: 'proyecto',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'proyecto', path: '/tiempo/proyectos' }
      }));
    }
  },
  'tiempo/tareas': {
    name: 'tarea',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'tarea', path: '/tiempo/tareas' }
      }));
    }
  },
  'assets/propiedades': {
    name: 'propiedad',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'propiedad', path: '/assets/propiedades' }
      }));
    }
  },
  'assets/finanzas': {
    name: 'transacción',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'transaccion', path: '/assets/finanzas' }
      }));
    }
  },
  'assets/finanzas/cuentas': {
    name: 'cuenta',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'cuenta', path: '/assets/finanzas/cuentas' }
      }));
    }
  },
  'assets/finanzas/monedas': {
    name: 'moneda',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'moneda', path: '/assets/finanzas/monedas' }
      }));
    }
  },
  'salud/rutinas': {
    name: 'rutina',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'rutina', path: '/salud/rutinas' }
      }));
    }
  },
  'assets/propiedades/inquilinos': {
    name: 'inquilino',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'inquilino', path: '/assets/propiedades/inquilinos' }
      }));
    }
  },
  'assets/propiedades/contratos': {
    name: 'contrato',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'contrato', path: '/assets/propiedades/contratos' }
      }));
    }
  },
  'assets/propiedades/inventario': {
    name: 'inventario',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'inventario', path: '/assets/propiedades/inventario' }
      }));
    }
  },
  'assets/finanzas/recurrente': {
    name: 'transacción recurrente',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'transaccion-recurrente', path: '/assets/finanzas/recurrente' }
      }));
    }
  },
  'salud/datacorporal': {
    name: 'dato corporal',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'data-corporal', path: '/salud/datacorporal' }
      }));
    }
  },
  'salud/dieta': {
    name: 'dieta',
    action: () => {
      window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
        detail: { type: 'dieta', path: '/salud/dieta' }
      }));
    }
  }
};

// Mapeo personalizado de títulos de rutas
const ROUTE_TITLES = {
  '': 'mis assets',          // ruta raíz (Assets)
  'assets': 'mis assets', // También para la ruta /assets
  'salud': 'mi salud',
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
