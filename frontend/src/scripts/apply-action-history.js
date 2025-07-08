/**
 * Script para aplicar automáticamente el sistema de historial a todas las páginas
 * 
 * Este script muestra los cambios necesarios para cada página.
 * Para aplicar automáticamente, ejecuta este script y sigue las instrucciones.
 */

const PAGES_CONFIG = {
  'Proyectos.jsx': {
    entity: 'proyecto',
    apiEndpoint: '/api/proyectos',
    fetchFunction: 'fetchProyectos',
    description: 'Proyectos y tareas'
  },
  'Tareas.jsx': {
    entity: 'tarea', 
    apiEndpoint: '/api/tareas',
    fetchFunction: 'fetchTareas',
    description: 'Gestión de tareas'
  },
  'Propiedades.jsx': {
    entity: 'propiedad',
    apiEndpoint: '/api/propiedades', 
    fetchFunction: 'fetchPropiedades',
    description: 'Gestión de propiedades'
  },
  'Transacciones.jsx': {
    entity: 'transaccion',
    apiEndpoint: '/api/transacciones',
    fetchFunction: 'fetchTransacciones', 
    description: 'Transacciones financieras'
  },
  'Cuentas.jsx': {
    entity: 'cuenta',
    apiEndpoint: '/api/cuentas',
    fetchFunction: 'fetchCuentas',
    description: 'Gestión de cuentas'
  },
  'Monedas.jsx': {
    entity: 'moneda',
    apiEndpoint: '/api/monedas',
    fetchFunction: 'fetchMonedas',
    description: 'Gestión de monedas'
  },
  'Rutinas.jsx': {
    entity: 'rutina',
    apiEndpoint: '/api/rutinas',
    fetchFunction: 'fetchRutinas',
    description: 'Rutinas de salud'
  },
  'Inquilinos.jsx': {
    entity: 'inquilino',
    apiEndpoint: '/api/inquilinos',
    fetchFunction: 'fetchInquilinos',
    description: 'Gestión de inquilinos'
  },
  'Contratos.jsx': {
    entity: 'contrato',
    apiEndpoint: '/api/contratos',
    fetchFunction: 'fetchContratos',
    description: 'Contratos de alquiler'
  },
  'Habitaciones.jsx': {
    entity: 'habitacion',
    apiEndpoint: '/api/habitaciones',
    fetchFunction: 'fetchHabitaciones',
    description: 'Gestión de habitaciones'
  },
  'Inventario.jsx': {
    entity: 'inventario',
    apiEndpoint: '/api/inventarios',
    fetchFunction: 'fetchInventario',
    description: 'Control de inventario'
  },
  'Recurrente.jsx': {
    entity: 'transaccion_recurrente',
    apiEndpoint: '/api/transaccion-recurrente',
    fetchFunction: 'fetchRecurrentes',
    description: 'Transacciones recurrentes'
  }
};

/**
 * Genera el código para aplicar el sistema de historial a una página
 */
function generatePageCode(pageName, config) {
  return `
// === CAMBIOS PARA ${pageName} ===

// 1. IMPORTAR EL HOOK AUTOMÁTICO
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';

// 2. AGREGAR EL HOOK EN EL COMPONENTE
const { 
  isSupported,
  createWithHistory, 
  updateWithHistory, 
  deleteWithHistory 
} = usePageWithHistory(
  // Función para recargar datos
  async () => {
    await ${config.fetchFunction}();
  },
  // Función para manejar errores
  (error) => {
    console.error('Error al revertir acción:', error);
    enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
  }
);

// 3. REEMPLAZAR LAS FUNCIONES DE CRUD
// ANTES:
// const response = await clienteAxios.post('/api/${config.entity}s', data);
// addAction({ type: '${config.entity}', action: 'create', ... });

// DESPUÉS:
// await createWithHistory(data);

// 4. ELIMINAR EL MANEJO MANUAL DE EVENTOS DE DESHACER
// (Se maneja automáticamente)

// 5. ELIMINAR LA FUNCIÓN handleUndoAction
// (Se maneja automáticamente)
`;
}

/**
 * Genera un resumen de todos los cambios necesarios
 */
function generateSummary() {
  console.log('=== RESUMEN DE CAMBIOS PARA APLICAR SISTEMA DE HISTORIAL ===\n');
  
  Object.entries(PAGES_CONFIG).forEach(([pageName, config]) => {
    console.log(`📄 ${pageName}:`);
    console.log(`   - Entidad: ${config.entity}`);
    console.log(`   - Endpoint: ${config.apiEndpoint}`);
    console.log(`   - Descripción: ${config.description}`);
    console.log('');
  });
  
  console.log('=== PASOS PARA APLICAR AUTOMÁTICAMENTE ===\n');
  console.log('1. Importar usePageWithHistory en cada página');
  console.log('2. Reemplazar las funciones de CRUD con las versiones con historial');
  console.log('3. Eliminar el manejo manual de eventos de deshacer');
  console.log('4. Eliminar las funciones handleUndoAction personalizadas');
  console.log('5. El sistema se aplicará automáticamente basado en la ruta');
  console.log('');
  console.log('=== VENTAJAS ===');
  console.log('✅ No necesitas importar nada en cada página individualmente');
  console.log('✅ El sistema detecta automáticamente la entidad basada en la ruta');
  console.log('✅ Manejo automático de eventos de deshacer');
  console.log('✅ Código más limpio y mantenible');
  console.log('✅ Consistencia en toda la aplicación');
}

// Ejecutar el script
generateSummary();

// Generar código para cada página
Object.entries(PAGES_CONFIG).forEach(([pageName, config]) => {
  console.log(generatePageCode(pageName, config));
});

module.exports = {
  PAGES_CONFIG,
  generatePageCode,
  generateSummary
}; 