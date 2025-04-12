import { createContext, useContext, useState, useEffect } from 'react';
import clienteAxios from '../config/axios';
import { getNormalizedToday, toISODateString } from '../components/rutinas/utils/dateUtils';

// Crear el contexto
const RutinasContext = createContext();

// Hook personalizado para usar el contexto
export const useRutinas = () => {
  const context = useContext(RutinasContext);
  if (!context) {
    throw new Error('useRutinas debe ser usado dentro de un RutinasProvider');
  }
  return context;
};

// Provider Component
export const RutinasProvider = ({ children }) => {
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Actualizar la carga inicial de rutinas para marcar origen de configuración
  const fetchRutinas = async (force = false) => {
    try {
      // Si ya cargamos las rutinas y no se fuerza, retornar
      if (rutinas.length > 0 && !force) return;

      setLoading(true);
      setError(null);
      
      // Obtener rutinas y configuración global en paralelo
      const [rutinasResponse, configResponse] = await Promise.all([
        clienteAxios('/api/rutinas'),
        clienteAxios('/api/users/rutinas-config')
      ]);

      const data = rutinasResponse.data;
      const globalConfig = configResponse.data || {};

      // Aquí comparamos cada ítem con su configuración global correspondiente
      const rutinasConMarcadores = data.map(rutina => {
        // Normalizar la fecha de la rutina
        const fechaNormalizada = toISODateString(rutina.fecha);
        
        // Procesar cada sección de la rutina
        const seccionesActualizadas = {};
        
        // Para cada sección en la rutina
        Object.keys(rutina).forEach(seccionKey => {
          if (typeof rutina[seccionKey] === 'object' && !Array.isArray(rutina[seccionKey])) {
            seccionesActualizadas[seccionKey] = {};
            
            // Para cada ítem en la sección
            Object.keys(rutina[seccionKey]).forEach(itemKey => {
              const itemActual = rutina[seccionKey][itemKey];
              
              // Si no es un objeto, no lo procesamos
              if (typeof itemActual !== 'object') {
                seccionesActualizadas[seccionKey][itemKey] = itemActual;
                return;
              }
              
              // Buscar la configuración global correspondiente
              const configGlobal = globalConfig[seccionKey]?.[itemKey];
              
              // Si no hay configuración global, marcamos como personalizada
              if (!configGlobal) {
                seccionesActualizadas[seccionKey][itemKey] = {
                  ...itemActual,
                  _source: 'LOCAL'
                };
                return;
              }
              
              // Comparar configuración actual con la global para determinar si es igual
              let esIgualAGlobal = true;
              
              // Comparar propiedades relevantes para determinar si la configuración es igual
              const propsAComparar = ['activado', 'frecuencia'];
              
              for (const prop of propsAComparar) {
                if (JSON.stringify(itemActual[prop]) !== JSON.stringify(configGlobal[prop])) {
                  esIgualAGlobal = false;
                  break;
                }
              }
              
              // Marcar origen de la configuración
              seccionesActualizadas[seccionKey][itemKey] = {
                ...itemActual,
                _source: esIgualAGlobal ? 'GLOBAL' : 'LOCAL'
              };
            });
          } else {
            // Si no es un objeto, mantener el valor original
            seccionesActualizadas[seccionKey] = rutina[seccionKey];
          }
        });
        
        return {
          ...rutina,
          fecha: fechaNormalizada,
          ...seccionesActualizadas
        };
      });

      setRutinas(rutinasConMarcadores);
    } catch (error) {
      console.error('[RutinasContext] Error al cargar rutinas:', error);
      setError('Error al cargar las rutinas');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar la configuración de un ítem
  const updateItemConfig = async (rutinasId, seccion, itemId, configData) => {
    try {
      // Estructura para actualizar configuración
      const normalizedConfig = {
        activado: Boolean(configData.activado),
        frecuencia: {
          valor: parseInt(configData.frecuencia.valor) || 1,
          tipo: configData.frecuencia.tipo || 'dias',
          periodo: configData.frecuencia.periodo || 'cada'
        },
        recordatorio: {
          activado: Boolean(configData.recordatorio?.activado),
          hora: configData.recordatorio?.hora || "08:00"
        },
        _source: configData._source || 'LOCAL',
        _lastUpdate: toISODateString(getNormalizedToday())
      };

      // Optimistic update
      setRutinas(prev => prev.map(rutina => {
        if (rutina._id !== rutinasId) return rutina;
        
        // Crear copia profunda para no mutar el estado directamente
        const rutinaCopia = JSON.parse(JSON.stringify(rutina));
        
        // Actualizar la sección y el ítem específico
        if (rutinaCopia[seccion] && rutinaCopia[seccion][itemId]) {
          rutinaCopia[seccion][itemId] = {
            ...rutinaCopia[seccion][itemId],
            ...normalizedConfig
          };
        }
        
        return rutinaCopia;
      }));

      // Actualizar en el servidor
      const { data } = await clienteAxios.put(`/api/rutinas/${rutinasId}/config`, {
        seccion,
        itemId,
        config: normalizedConfig
      });

      return data;
    } catch (error) {
      console.error('[RutinasContext] Error al actualizar configuración:', error);
      throw error;
    }
  };

  // Cargar rutinas al montar el componente
  useEffect(() => {
    fetchRutinas();
  }, []);

  return (
    <RutinasContext.Provider value={{
      rutinas,
      loading,
      error,
      fetchRutinas,
      updateItemConfig
    }}>
      {children}
    </RutinasContext.Provider>
  );
};

export default RutinasContext; 