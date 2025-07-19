import React from 'react';
import { icons } from './menuIcons';

export const menuItems = [
  {
    id: 'assets',
    title: 'Assets',
    icon: icons.dollarSign,
    path: '/assets',
    hasSubItems: true,
    subItems: [
      {
        id: 'finanzas',
        title: 'Finanzas', // nombre para mostrar
        icon: icons.wallet,
        path: '/assets/finanzas', // Ahora tiene su propio path
        hasSubItems: true,
        subItems: [
          { id: 'transacciones', title: 'Transacciones', path: '/assets/finanzas/transacciones', icon: icons.moneyBag },
          { id: 'cuentas', title: 'Cuentas', path: '/assets/finanzas/cuentas', icon: icons.accountBalance },
          { id: 'monedas', title: 'Monedas', path: '/assets/finanzas/monedas', icon: icons.currency },
          { id: 'inversiones', title: 'Inversiones', path: '/assets/finanzas/inversiones', icon: icons.inversiones, isUnderConstruction: true },
          { id: 'deudores', title: 'Deudores', path: '/assets/finanzas/deudores', icon: icons.personSearch, isUnderConstruction: true },
          { id: 'recurrente', title: 'Recurrente', path: '/assets/finanzas/recurrente', icon: icons.repeat, isUnderConstruction: true }
        ]
      },
      {
        id: 'propiedades',
        title: 'Propiedades',
        icon: icons.apartment,
        path: '/assets/propiedades',
        hasSubItems: true,
        subItems: [
          { id: 'inquilinos', title: 'Inquilinos', path: '/assets/propiedades/inquilinos', icon: icons.person },
          { id: 'contratos', title: 'Contratos', path: '/assets/propiedades/contratos', icon: icons.description },
        ]
      },
      {
        id: 'autos',
        title: 'Autos',
        icon: icons.auto,
        path: '/assets/autos',
        hasSubItems: false,
        isUnderConstruction: true
      },
      {
        id: 'inventario',
        title: 'Inventario',
        icon: icons.inventario,
        path: '/assets/inventario',
        hasSubItems: false,
        isUnderConstruction: true
      }
    ]
  },
  {
    id: 'salud',
    title: 'Salud',
    icon: icons.health,
    path: '/salud',
    hasSubItems: true,
    subItems: [
      { id: 'datacorporal', title: 'Data corporal', icon: icons.monitorHeart, path: '/salud/datacorporal', hasSubItems: false, isUnderConstruction: true },
      { id: 'dieta', title: 'Dieta', icon: icons.restaurant, path: '/salud/dieta', hasSubItems: false, isUnderConstruction: true },
      { id: 'lab', title: 'Lab', icon: icons.science, path: '/salud/lab', hasSubItems: false, isUnderConstruction: true }
    ]
  },
  {
    id: 'tiempo',
    title: 'Tiempo',
    icon: icons.accessTime,
    path: '/tiempo',
    hasSubItems: true,
    subItems: [
      { id: 'proyectos', title: 'Proyectos', icon: icons.folder, path: '/tiempo/proyectos', hasSubItems: false },
      { id: 'tareas', title: 'Tareas', icon: icons.task, path: '/tiempo/tareas', hasSubItems: false },
      { id: 'archivo', title: 'Archivo', icon: icons.archive, path: '/tiempo/archivo', hasSubItems: false },
      { id: 'rutinas', title: 'Rutinas', icon: icons.fitnessCenter, path: '/tiempo/rutinas', hasSubItems: false }
    ]
  },
  {
    id: 'setup',
    title: 'Setup',
    icon: icons.settings,
    path: '/configuracion',
    hasSubItems: true,
    subItems: [
      { id: 'perfil', title: 'Perfil', path: '/configuracion/perfil', icon: icons.accountCircle, hasSubItems: false },
      { id: 'preferencias', title: 'Preferencias', path: '/configuracion/preferencias', icon: icons.manageAccounts, hasSubItems: false }
    ]
  }
];

// Configuración de navegación inferior - elementos principales para acceso rápido
export const bottomNavigationItems = [
  {
    id: 'assets',
    title: 'Assets',
    icon: icons.dollarSign,
    path: '/assets',
    activePaths: ['/', '/assets']
  },
  {
    id: 'salud',
    title: 'Salud',
    icon: icons.health,
    path: '/salud',
    activePaths: ['/salud']
  },
  {
    id: 'tiempo',
    title: 'Tiempo',
    icon: icons.accessTime,
    path: '/tiempo',
    activePaths: ['/tiempo']
  }
];

// Función helper para obtener elementos de navegación inferior con iconos resueltos
export const getBottomNavigationItems = () => {
  return bottomNavigationItems.map(item => ({
    ...item,
    icon: item.icon // Los iconos ya están resueltos en la definición
  }));
};

// Función helper para obtener elementos de menú con iconos resueltos
export const getMenuItems = () => {
  return menuItems.map(item => ({
    ...item,
    icon: item.icon // Los iconos ya están resueltos en la definición
  }));
}; 