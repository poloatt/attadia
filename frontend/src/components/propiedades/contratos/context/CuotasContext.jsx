import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { calcularEstadoCuota, generarCuotasMensuales } from '../contratoUtils';
import clienteAxios from '../../../../config/axios';

const CuotasContext = createContext();

export const useCuotasContext = () => {
  const context = useContext(CuotasContext);
  if (!context) {
    throw new Error('useCuotasContext debe ser usado dentro de un CuotasProvider');
  }
  return context;
};

export const CuotasProvider = ({ children, contratoId, formData }) => {
  const [cuotas, setCuotas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generar cuotas automáticamente cuando cambian las fechas o precio
  useEffect(() => {
    if (formData && formData.fechaInicio && formData.fechaFin && formData.precioTotal && !formData.esMantenimiento) {
      const cuotasGeneradas = generarCuotasMensuales({
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        precioTotal: parseFloat(formData.precioTotal) || 0,
        esMantenimiento: false
      });
      
      // Si ya hay cuotasMensuales (por edición), usar esas en lugar de generar nuevas
      if (formData.cuotasMensuales && formData.cuotasMensuales.length > 0) {
        const cuotasSincronizadas = formData.cuotasMensuales.map(cuota => {
          let estadoCalculado = calcularEstadoCuota(cuota, {
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin
          });
          if (!['PAGADO', 'VENCIDA', 'PENDIENTE'].includes(estadoCalculado)) {
            estadoCalculado = 'PENDIENTE';
          }
          return {
            ...cuota,
            estado: estadoCalculado || 'PENDIENTE'
          };
        });
        setCuotas(cuotasSincronizadas);
      } else {
        setCuotas(cuotasGeneradas);
      }
    } else {
      setCuotas([]);
    }
  }, [formData?.fechaInicio, formData?.fechaFin, formData?.precioTotal, formData?.esMantenimiento, formData?.cuotasMensuales]);

  // Función para sincronizar cuotas desde datos externos
  const syncCuotas = useCallback((externalCuotas, formData) => {
    if (externalCuotas && Array.isArray(externalCuotas)) {
      const cuotasSincronizadas = externalCuotas.map(cuota => {
        let estadoCalculado = calcularEstadoCuota(cuota, {
          fechaInicio: formData?.fechaInicio,
          fechaFin: formData?.fechaFin
        });
        if (!['PAGADO', 'VENCIDA', 'PENDIENTE'].includes(estadoCalculado)) {
          estadoCalculado = 'PENDIENTE';
        }
        return {
          ...cuota,
          estado: estadoCalculado || 'PENDIENTE'
        };
      });
      
      setCuotas(cuotasSincronizadas);
      return cuotasSincronizadas;
    }
    return [];
  }, []);

  // Función para actualizar una cuota específica
  const updateCuota = useCallback((index, updates) => {
    setCuotas(prevCuotas => {
      const newCuotas = [...prevCuotas];
      newCuotas[index] = { ...newCuotas[index], ...updates };
      return newCuotas;
    });
  }, []);

  // Función para actualizar el monto de una cuota
  const updateCuotaMonto = useCallback((index, monto) => {
    updateCuota(index, { monto: parseFloat(monto) || 0 });
  }, [updateCuota]);

  // Función para actualizar el estado de una cuota
  const updateCuotaEstado = useCallback((index, estado) => {
    updateCuota(index, { estado });
  }, [updateCuota]);

  // Función para actualizar todas las cuotas
  const updateAllCuotas = useCallback((newCuotas) => {
    setCuotas(newCuotas);
  }, []);

  // Función para normalizar cuotas antes de guardar
  const normalizarCuotas = useCallback((cuotasToNormalize) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return cuotasToNormalize.map(cuota => {
      if (cuota.estado === 'PAGADO') return { ...cuota, estado: 'PAGADO' };
      const fechaVencimiento = new Date(cuota.fechaVencimiento);
      fechaVencimiento.setHours(0, 0, 0, 0);
      if (hoy > fechaVencimiento) {
        return { ...cuota, estado: 'VENCIDA' };
      } else {
        return { ...cuota, estado: 'PENDIENTE' };
      }
    });
  }, []);

  // Función para guardar cuotas en el backend y actualizar el estado global
  const guardarCuotasEnBackend = useCallback(async (cuotasActualizadas) => {
    if (!contratoId) return false;
    setIsLoading(true);
    try {
      // Normalizar las cuotas antes de guardar para asegurar consistencia
      const cuotasNormalizadas = normalizarCuotas(cuotasActualizadas);
      
      await clienteAxios.put(`/api/contratos/${contratoId}/cuotas`, { cuotas: cuotasNormalizadas });
      
      // Actualizar el estado local con las cuotas normalizadas
      setCuotas(cuotasNormalizadas);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error al guardar cuotas:', error);
      setIsLoading(false);
      // Aquí puedes agregar notificación de error
      return false;
    }
  }, [contratoId, normalizarCuotas]);

  // Función para refrescar cuotas desde el backend
  const refrescarCuotasDesdeBackend = useCallback(async () => {
    if (!contratoId) return false;
    setIsLoading(true);
    try {
      const response = await clienteAxios.get(`/api/contratos/${contratoId}`);
      if (response.data && response.data.cuotasMensuales) {
        const cuotasSincronizadas = syncCuotas(response.data.cuotasMensuales, formData);
        setCuotas(cuotasSincronizadas);
      }
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error al refrescar cuotas:', error);
      setIsLoading(false);
      return false;
    }
  }, [contratoId, syncCuotas, formData]);

  const value = {
    cuotas,
    isLoading,
    setIsLoading,
    syncCuotas,
    updateCuota,
    updateCuotaMonto,
    updateCuotaEstado,
    updateAllCuotas,
    normalizarCuotas,
    guardarCuotasEnBackend,
    refrescarCuotasDesdeBackend,
    contratoId
  };

  return (
    <CuotasContext.Provider value={value}>
      {children}
    </CuotasContext.Provider>
  );
}; 