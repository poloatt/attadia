import { useMemo, useCallback } from 'react';
import { procesarContratosOptimizado, getEstadoCompleto } from '../utils/statusOptimizer.js';

// Hook para optimizar el procesamiento de estados
export function useStatusOptimizer() {
  
  // Procesar contratos de manera optimizada
  const procesarContratos = useCallback((contratos) => {
    return procesarContratosOptimizado(contratos || []);
  }, []);

  // Obtener estado completo de un contrato
  const getEstadoContrato = useCallback((contrato, tipo = 'CONTRATO') => {
    return getEstadoCompleto(contrato, tipo);
  }, []);

  // Procesar propiedades con contratos optimizados
  const procesarPropiedades = useCallback((propiedades) => {
    return propiedades.map(propiedad => ({
      ...propiedad,
      contratos: procesarContratosOptimizado(propiedad.contratos || []),
      inquilinos: propiedad.inquilinos || [],
      habitaciones: propiedad.habitaciones || [],
      inventario: propiedad.inventario || []
    }));
  }, []);

  // Memoizar el procesamiento para evitar recálculos
  const procesarContratosMemoizado = useMemo(() => {
    return procesarContratos;
  }, [procesarContratos]);

  return {
    procesarContratos: procesarContratosMemoizado,
    getEstadoContrato,
    procesarPropiedades
  };
}

// Hook específico para contratos
export function useContratosOptimizados(contratos) {
  return useMemo(() => {
    return procesarContratosOptimizado(contratos || []);
  }, [contratos]);
}

// Hook específico para propiedades
export function usePropiedadesOptimizadas(propiedades) {
  return useMemo(() => {
    return propiedades.map(propiedad => ({
      ...propiedad,
      contratos: procesarContratosOptimizado(propiedad.contratos || []),
      inquilinos: propiedad.inquilinos || [],
      habitaciones: propiedad.habitaciones || [],
      inventario: propiedad.inventario || []
    }));
  }, [propiedades]);
} 