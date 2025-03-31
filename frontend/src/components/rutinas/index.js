/**
 * Punto de entrada para el módulo de rutinas
 * Exporta todos los componentes, contextos, servicios y utilidades necesarios
 */

// Exportar componentes principales
export { RutinaTable } from './RutinaTable';
export { RutinaForm } from './RutinaForm';
export { default as ChecklistSection } from './ChecklistSection';
export { default as ItemCadenciaConfig } from './ItemCadenciaConfig';
export { default as SeleccionDias } from './SeleccionDias';
export { default as FrecuenciaControl } from './FrecuenciaControl';
export { RutinaNavigation } from './RutinaNavigation';
export { default as InlineItemConfig } from './InlineItemConfig';

// Contexto y Provider
export { RutinasProvider, useRutinas } from './context/RutinasContext';

// Hooks
export { default as useDebounce } from './hooks/useDebounce';
export { default as useOptimisticUpdate } from './hooks/useOptimisticUpdate';
export { default as useLocalPreservationState } from './hooks/useLocalPreservationState';

// Utilidades
export * from './utils/iconConfig';
export * from './utils/localChanges'; 