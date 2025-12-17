import React from 'react';
// import { icons } from './menuIcons'; // Ya no se usa icons directamente

// Nueva estructura: modulos (primer nivel = módulo raíz)
export const modulos = [
  {
    id: 'assets',
    title: 'Atta',
    icon: 'dollarSign',
    path: '/finanzas',
    subItems: [
      {
        id: 'finanzas',
        title: 'Finanzas',
        icon: 'wallet',
        path: '/finanzas',
        subItems: [
          { id: 'transacciones', title: 'Transacciones', path: '/finanzas/transacciones', icon: 'moneyBag', canAdd: true },
          { id: 'cuentas', title: 'Cuentas', path: '/finanzas/cuentas', icon: 'accountBalance', canAdd: true },
          { id: 'monedas', title: 'Monedas', path: '/finanzas/monedas', icon: 'currency', canAdd: true },
          { id: 'inversiones', title: 'Inversiones', path: '/finanzas/inversiones', icon: 'inversiones', isUnderConstruction: true },
          { id: 'deudores', title: 'Deudores', path: '/finanzas/deudores', icon: 'personSearch', isUnderConstruction: true },
          { id: 'recurrente', title: 'Recurrente', path: '/finanzas/recurrente', icon: 'repeat', isUnderConstruction: true }
        ]
      },
      {
        id: 'bienes',
        title: 'Bienes',
        icon: 'bienes',
        path: '/propiedades',
        canAdd: true,
        subItems: [
          { id: 'propiedades', title: 'Propiedades', path: '/propiedades', icon: 'apartment', canAdd: true },
          { id: 'habitaciones', title: 'Habitaciones', path: '/propiedades/habitaciones', icon: 'bed', canAdd: true },
          { id: 'contratos', title: 'Contratos', path: '/propiedades/contratos', icon: 'description', canAdd: true },
          { id: 'inquilinos', title: 'Inquilinos', path: '/propiedades/inquilinos', icon: 'person', canAdd: true },
          { id: 'inventario', title: 'Inventario', path: '/propiedades/inventario', icon: 'inventario', isUnderConstruction: true },
          { id: 'vehiculos', title: 'Vehículos', path: '/propiedades/autos', icon: 'auto', isUnderConstruction: true }
        ]
      }
    ]
  },
  {
    id: 'salud',
    title: 'Pulso',
    icon: 'health',
    path: '/datacorporal',
    subItems: [
      { id: 'datacorporal', title: 'Data corporal', icon: 'monitorHeart', path: '/datacorporal', canAdd: true },
      { id: 'dieta', title: 'Dieta', icon: 'restaurant', path: '/dieta', isUnderConstruction: true },
      { id: 'lab', title: 'Lab', icon: 'science', path: '/lab', isUnderConstruction: true }
    ]
  },
  {
    id: 'tiempo',
    title: 'Foco',
    icon: 'accessTime',
    path: '/rutinas',
    subItems: [
      { id: 'rutinas', title: 'Rutinas', icon: 'fitnessCenter', path: '/rutinas', canAdd: true },
      { id: 'tareas', title: 'Agenda', icon: 'agenda', path: '/tareas', canAdd: true },
      { id: 'proyectos', title: 'Proyectos', icon: 'folder', path: '/proyectos', canAdd: true }
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
    appKey: 'atta',
    title: 'Atta',
    icon: 'dollarSign',
    path: '/finanzas',
    type: 'module',
    activePaths: ['/', '/finanzas', '/propiedades']
  },
  {
    id: 'salud',
    appKey: 'pulso',
    title: 'Pulso',
    icon: 'health',
    path: '/datacorporal',
    type: 'module',
    activePaths: ['/datacorporal', '/dieta', '/lab']
  },
  {
    id: 'tiempo',
    appKey: 'foco',
    title: 'Foco',
    icon: 'accessTime',
    path: '/rutinas',
    type: 'module',
    activePaths: ['/rutinas', '/proyectos', '/tareas', '/archivo']
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