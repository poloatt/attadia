import React from 'react';
// import { icons } from './menuIcons'; // Ya no se usa icons directamente

// Nueva estructura: modulos (primer nivel = módulo raíz)
export const modulos = [
  {
    id: 'assets',
    title: 'Atta',
    icon: 'dollarSign',
    path: '/assets/finanzas',
    subItems: [
      {
        id: 'finanzas',
        title: 'Finanzas',
        icon: 'wallet',
        path: '/assets/finanzas',
        subItems: [
          { id: 'transacciones', title: 'Transacciones', path: '/assets/finanzas/transacciones', icon: 'moneyBag', canAdd: true },
          { id: 'cuentas', title: 'Cuentas', path: '/assets/finanzas/cuentas', icon: 'accountBalance', canAdd: true },
          { id: 'monedas', title: 'Monedas', path: '/assets/finanzas/monedas', icon: 'currency', canAdd: true },
          { id: 'inversiones', title: 'Inversiones', path: '/assets/finanzas/inversiones', icon: 'inversiones', isUnderConstruction: true },
          { id: 'deudores', title: 'Deudores', path: '/assets/finanzas/deudores', icon: 'personSearch', isUnderConstruction: true },
          { id: 'recurrente', title: 'Recurrente', path: '/assets/finanzas/recurrente', icon: 'repeat', isUnderConstruction: true }
        ]
      },
      {
        id: 'bienes',
        title: 'Bienes',
        icon: 'bienes',
        path: '/assets/propiedades',
        canAdd: true,
        subItems: [
          { id: 'propiedades', title: 'Propiedades', path: '/assets/propiedades', icon: 'apartment', canAdd: true },
          { id: 'habitaciones', title: 'Habitaciones', path: '/assets/propiedades/habitaciones', icon: 'bed', canAdd: true },
          { id: 'contratos', title: 'Contratos', path: '/assets/propiedades/contratos', icon: 'description', canAdd: true },
          { id: 'inquilinos', title: 'Inquilinos', path: '/assets/propiedades/inquilinos', icon: 'person', canAdd: true },
          { id: 'inventario', title: 'Inventario', path: '/assets/propiedades/inventario', icon: 'inventario', isUnderConstruction: true },
          { id: 'vehiculos', title: 'Vehículos', path: '/assets/propiedades/vehiculos', icon: 'auto', isUnderConstruction: true }
        ]
      }
    ]
  },
  {
    id: 'salud',
    title: 'Pulso',
    icon: 'health',
    path: '/salud/datacorporal',
    subItems: [
      { id: 'datacorporal', title: 'Data corporal', icon: 'monitorHeart', path: '/salud/datacorporal', canAdd: true },
      { id: 'dieta', title: 'Dieta', icon: 'restaurant', path: '/salud/dieta', isUnderConstruction: true },
      { id: 'lab', title: 'Lab', icon: 'science', path: '/salud/lab', isUnderConstruction: true }
    ]
  },
  {
    id: 'tiempo',
    title: 'Foco',
    icon: 'accessTime',
    path: '/tiempo/rutinas',
    subItems: [
      { id: 'rutinas', title: 'Rutinas', icon: 'fitnessCenter', path: '/tiempo/rutinas', canAdd: true },
      { id: 'proyectos', title: 'Proyectos', icon: 'folder', path: '/tiempo/proyectos' },
      { id: 'tareas', title: 'Tareas', icon: 'task', path: '/tiempo/tareas' },
      { id: 'archivo', title: 'Archivo', icon: 'archive', path: '/tiempo/archivo' }
    ]
  },
  {
    id: 'setup',
    title: 'Setup',
    icon: 'settings',
    path: '/configuracion',
    subItems: [
      { id: 'perfil', title: 'Perfil', path: '/configuracion/perfil', icon: 'accountCircle' },
      { id: 'preferencias', title: 'Preferencias', path: '/configuracion/preferencias', icon: 'manageAccounts' }
    ]
  }
];

// Navegación inferior adaptada a la nueva estructura
export const bottomNavigationItems = [
  {
    id: 'assets',
    title: 'Atta',
    icon: 'dollarSign',
    path: '/assets/finanzas',
    type: 'module',
    activePaths: ['/', '/assets', '/assets/finanzas']
  },
  {
    id: 'salud',
    title: 'Pulso',
    icon: 'health',
    path: '/salud/datacorporal',
    type: 'module',
    activePaths: ['/salud', '/salud/datacorporal']
  },
  {
    id: 'tiempo',
    title: 'Foco',
    icon: 'accessTime',
    path: '/tiempo/rutinas',
    type: 'module',
    activePaths: ['/tiempo', '/tiempo/rutinas']
  }
];

// Helpers adaptados
export const getBottomNavigationItems = () => {
  return bottomNavigationItems.map(item => ({
    ...item,
    icon: item.icon
  }));
};

export const getModulos = () => {
  return modulos.map(item => ({
    ...item,
    icon: item.icon
  }));
};

// Para obtener solo los módulos (primer nivel)
export const getRootModules = () => {
  return modulos;
}; 