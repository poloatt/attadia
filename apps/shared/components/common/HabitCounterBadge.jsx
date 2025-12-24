import React, { useMemo } from 'react';
import { Badge } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightlightIcon from '@mui/icons-material/Nightlight';
import { contarCompletadosEnPeriodo } from '@shared/utils/cadenciaUtils';

/**
 * Componente Badge que muestra la frecuencia o el icono de horario de un hábito
 * 
 * @param {Object} props
 * @param {Object} props.config - Configuración del hábito (tipo, frecuencia, horarios)
 * @param {string} props.currentTimeOfDay - Horario actual ('MAÑANA', 'TARDE', 'NOCHE')
 * @param {string} props.size - Tamaño del badge ('small' | 'medium')
 * @param {string} props.overlap - Tipo de superposición ('circular' | 'rectangular' | 'subtle')
 * @param {Object} props.rutina - Rutina actual (opcional, para calcular progreso del período)
 * @param {string} props.section - Sección del hábito (opcional, para calcular progreso)
 * @param {string} props.itemId - ID del ítem (opcional, para calcular progreso)
 * @param {React.ReactNode} props.children - Elemento hijo (generalmente un IconButton)
 */
export const HabitCounterBadge = ({ 
  config = {}, 
  currentTimeOfDay = 'MAÑANA',
  size = 'small',
  overlap = 'rectangular',
  rutina = null,
  section = null,
  itemId = null,
  children 
}) => {
  const tipo = (config?.tipo || 'DIARIO').toUpperCase();
  const frecuencia = Number(config?.frecuencia || 1);
  const horarios = Array.isArray(config?.horarios) ? config.horarios : [];
  const periodo = config?.periodo ? config.periodo.toUpperCase() : null;

  // Calcular completados del período actual para hábitos semanales/mensuales
  const completadosEnPeriodo = useMemo(() => {
    if (!rutina || !section || !itemId) return null;
    
    // Solo calcular para SEMANAL/MENSUAL/PERSONALIZADO (no DIARIO)
    if (tipo !== 'SEMANAL' && tipo !== 'MENSUAL' && 
        !(tipo === 'PERSONALIZADO' && periodo && periodo !== 'CADA_DIA')) {
      return null;
    }

    try {
      // Obtener historial de completados desde rutina.historial[section][itemId]
      // El historial se estructura como: historial[section][itemId][YYYY-MM-DD] = true
      const historialSection = rutina?.historial?.[section];
      
      // Convertir historial a array de fechas
      // El historial viene como objeto { 'YYYY-MM-DD': true }
      let historialCompletado = [];
      if (historialSection && historialSection[itemId]) {
        const historialItem = historialSection[itemId];
        if (typeof historialItem === 'object' && !Array.isArray(historialItem)) {
          historialCompletado = Object.keys(historialItem)
            .filter(fecha => historialItem[fecha] === true)
            .map(fecha => {
              // Parsear fecha YYYY-MM-DD a Date
              const [year, month, day] = fecha.split('-').map(Number);
              return new Date(year, month - 1, day, 12, 0, 0, 0);
            });
        } else if (Array.isArray(historialItem)) {
          // Fallback: si viene como array de fechas
          historialCompletado = historialItem.map(fecha => new Date(fecha));
        }
      }

      // Calcular completados del período actual
      const hoy = new Date();
      let completados = contarCompletadosEnPeriodo(hoy, tipo, periodo || 'CADA_DIA', historialCompletado);
      
      // Verificar si el hábito está completado hoy y agregarlo si no está en el historial
      const completadoHoy = rutina?.[section]?.[itemId] === true;
      if (completadoHoy) {
        const hoyStr = hoy.toISOString().split('T')[0];
        const yaEstaEnHistorial = historialCompletado.some(fecha => {
          const fechaStr = fecha.toISOString().split('T')[0];
          return fechaStr === hoyStr;
        });
        
        // Si no está en el historial, agregarlo al conteo
        if (!yaEstaEnHistorial) {
          completados++;
        }
      }
      
      return completados;
    } catch (error) {
      console.error('[HabitCounterBadge] Error calculando completados en período:', error);
      return null;
    }
  }, [rutina, section, itemId, tipo, periodo]);

  // Determinar qué mostrar en el badge
  let badgeContent = null;
  let showBadge = false;
  let isNumber = false; // Flag para saber si es número o icono

  // Para hábitos periódicos (SEMANAL, MENSUAL): mostrar completados del período actual
  if (tipo === 'SEMANAL' || tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo !== 'CADA_DIA')) {
    if (frecuencia > 1) {
      // Mostrar completados del período actual si está disponible, sino mostrar frecuencia como fallback
      const valorAMostrar = completadosEnPeriodo !== null ? completadosEnPeriodo : frecuencia;
      badgeContent = valorAMostrar;
      showBadge = true;
      isNumber = true; // Es un número, necesita borde
    }
  }
  // Para hábitos diarios con frecuencia > 1 o con horarios específicos: mostrar icono de horario
  else if (tipo === 'DIARIO' || (tipo === 'PERSONALIZADO' && config?.periodo === 'CADA_DIA')) {
    // Si tiene horarios configurados, mostrar icono del horario actual o último no completado
    if (horarios.length > 0) {
      const normalizedHorarios = horarios.map(h => String(h).toUpperCase());
      const normalizedTimeOfDay = String(currentTimeOfDay).toUpperCase();
      
      // Orden de horarios del día (de más temprano a más tarde)
      const HORARIOS_ORDER = ['MAÑANA', 'TARDE', 'NOCHE'];
      
      let horarioAMostrar = null;
      
      // Si el horario actual está en la lista, mostrarlo
      if (normalizedHorarios.includes(normalizedTimeOfDay)) {
        horarioAMostrar = normalizedTimeOfDay;
      } 
      // Si no, para hábitos diarios con múltiples repeticiones, mostrar el último horario no completado
      else if (frecuencia > 1 || normalizedHorarios.length > 1) {
        // Buscar el último horario configurado antes del horario actual
        const currentIndex = HORARIOS_ORDER.indexOf(normalizedTimeOfDay);
        for (let i = currentIndex - 1; i >= 0; i--) {
          const horarioAnterior = HORARIOS_ORDER[i];
          if (normalizedHorarios.includes(horarioAnterior)) {
            horarioAMostrar = horarioAnterior;
            break;
          }
        }
      }
      
      // Mostrar icono del horario determinado
      if (horarioAMostrar) {
        switch (horarioAMostrar) {
          case 'MAÑANA':
            badgeContent = <WbSunnyIcon sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }} />;
            showBadge = true;
            isNumber = false; // Es un icono, sin borde
            break;
          case 'TARDE':
            badgeContent = <WbTwilightIcon sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }} />;
            showBadge = true;
            isNumber = false; // Es un icono, sin borde
            break;
          case 'NOCHE':
            badgeContent = <NightlightIcon sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }} />;
            showBadge = true;
            isNumber = false; // Es un icono, sin borde
            break;
          default:
            showBadge = false;
        }
      }
    }
    // Si no tiene horarios pero frecuencia > 1, no mostrar badge (solo frecuencia)
    // (El badge solo muestra horarios, no frecuencia para diarios)
  }

  // Si no hay nada que mostrar, renderizar sin badge
  if (!showBadge) {
    return <>{children}</>;
  }

  // Calcular transform según el tipo de superposición
  const getTransform = () => {
    if (overlap === 'subtle') {
      // Superposición sutil para iconos grandes (38px) en vista expandida
      return size === 'medium' 
        ? 'translate(8%, 8%) scale(1)' // Para iconos más grandes (38px)
        : 'translate(15%, 15%) scale(1)'; // Para iconos más pequeños
    }
    // Por defecto: superposición estándar
    return 'translate(25%, 25%) scale(1)';
  };

  return (
    <Badge
      badgeContent={badgeContent}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      overlap={overlap === 'circular' ? 'circular' : 'rectangular'}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        '& .MuiBadge-badge': {
          minWidth: size === 'small' ? 12 : 14,
          height: size === 'small' ? 12 : 14,
          fontSize: size === 'small' ? '0.6rem' : '0.65rem',
          padding: size === 'small' ? '1px 3px' : '2px 4px',
          bgcolor: 'transparent',
          color: 'primary.main',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: getTransform(),
          zIndex: 1,
          '& svg': {
            fontSize: size === 'small' ? '0.65rem' : '0.7rem',
            color: 'primary.main'
          }
        }
      }}
    >
      {children}
    </Badge>
  );
};

export default HabitCounterBadge;

