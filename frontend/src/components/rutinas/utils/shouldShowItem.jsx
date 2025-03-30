import { format, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  isSameDay, isSameWeek, isSameMonth, isAfter, isBefore, compareAsc, parseISO, 
  isToday, startOfDay, addDays, getWeek, getMonth, getYear, isSameWeek as dfsIsSameWeek, endOfDay, isSameYear, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import rutinasService from '../../../services/rutinasService';

// Cache global para evitar múltiples llamadas al backend por los mismos datos
// Formato: {section_itemId_añoSemana: {completaciones, timestamp}}
const cacheHistorialCompletaciones = {};

/**
 * Cache para almacenar resultados de visibilidad y evitar recálculos innecesarios
 * Clave: section_itemId_rutinaId, Valor: {visible: boolean, timestamp: number}
 */
const cacheVisibilidad = {};

/**
 * Determina si un ítem debe ser mostrado en la interfaz basado en su configuración
 * y el historial de completitud.
 * 
 * @param {string} section Sección a la que pertenece el ítem (bodyCare, nutricion, etc)
 * @param {string} itemId Identificador del ítem a evaluar
 * @param {Object} rutina Objeto de rutina completo
 * @returns {Promise<boolean>} Promesa con verdadero si el ítem debe mostrarse
 */
const shouldShowItem = async (section, itemId, rutina) => {
  // Verificar si hay configuración para el ítem
  if (!rutina?.config?.[section]?.[itemId]) {
    return true; // Si no hay configuración, mostrar por defecto
  }

  // Obtener la configuración del ítem
  const itemConfig = rutina.config[section][itemId];

  // Verificar si el ítem está activo en su configuración
  if (itemConfig && itemConfig.activo === false) {
    return false;
  }

  // Siempre mostrar ítems para cualquier rutina (hoy, pasado o futuro)
  // para permitir la edición de rutinas pasadas
  return true;
};

/**
 * Determina si un ítem debe mostrarse en la vista principal (no colapsada)
 * basado en su configuración y estado de completitud.
 * 
 * @param {string} section Sección a la que pertenece el ítem
 * @param {string} itemId Identificador del ítem
 * @param {Object} rutina Objeto de rutina completo
 * @returns {Promise<boolean>} Promesa con verdadero si debe mostrarse en la vista principal
 */
export async function shouldShowItemInMainView(section, itemId, rutina) {
  try {
    // 1. Verificaciones básicas
    if (!esItemValido(section, itemId, rutina)) {
      console.log(`[SHOW_ITEM] ${section}.${itemId}: No válido o inactivo`);
      return false;
    }
    
    // 2. Para rutinas pasadas, mostrar todos los elementos
    if (isRutinaPasada(rutina)) {
      console.log(`[SHOW_ITEM] ${section}.${itemId}: Es rutina pasada, se muestra siempre`);
      return true;
    }
    
    // 3. Para rutinas de hoy, aplicar lógica de cadencia
    if (isRutinaDeHoy(rutina)) {
      // Verificar cache para evitar recálculos frecuentes (reducir a 5 segundos)
      const claveCache = `${section}_${itemId}_${rutina._id}_${!!rutina[section]?.[itemId]}`;
      const datosCache = cacheVisibilidad[claveCache];
      
      // DEBUGGING: Mostrar información de caché
      console.log(`[SHOW_ITEM] Validando caché para ${section}.${itemId}: ${datosCache ? 'Encontrado' : 'No encontrado'}`);
      
      // Reducir tiempo de caché a 5 segundos para respuesta más rápida
      if (datosCache && (Date.now() - datosCache.timestamp < 5000)) { // Caché de 5 segundos
        console.log(`[SHOW_ITEM] Usando resultado cacheado para ${section}.${itemId}: ${datosCache.visible ? 'Mostrar' : 'Ocultar'} (Razón: ${datosCache.razon})`);
        return datosCache.visible;
      }
      
      // MEJORA: Respuesta inmediata para ítems completados hoy
      const itemCompletadoHoy = rutina[section]?.[itemId] === true;
      
      // Si está completado hoy, siempre mostrar (respuesta inmediata para mejor UX)
      if (itemCompletadoHoy) {
        console.log(`[SHOW_ITEM] ${section}.${itemId}: Completado HOY, siempre visible (respuesta rápida)`);
        
        // Guardar en caché
        cacheVisibilidad[claveCache] = {
          visible: true,
          timestamp: Date.now(),
          razon: "completado_hoy"
        };
        
        return true;
      }
      
      // MEJORA: Para ítem específico con cadencia, determinar rápidamente
      // Obtener configuración del ítem
      const itemConfig = rutina.config?.[section]?.[itemId];
      if (itemConfig) {
        const tipo = itemConfig.tipo?.toUpperCase() || 'DIARIO';
        const frecuencia = Number(itemConfig.frecuencia || 1);
        
        // CASO ESPECIAL: Si es diario y no está completado hoy, mostrar siempre
        if (tipo === 'DIARIO') {
          console.log(`[SHOW_ITEM] ${section}.${itemId}: Diario no completado hoy, siempre visible`);
          
          // Guardar en caché
          cacheVisibilidad[claveCache] = {
            visible: true,
            timestamp: Date.now(),
            razon: "diario_no_completado"
          };
          
          return true;
        }
        
        // Para otros casos (SEMANAL/MENSUAL), hacer cálculo completo
        console.log(`[SHOW_ITEM] ${section}.${itemId}: Calculando visibilidad para cadencia ${tipo}`);
      }
      
      // Para otros casos, calcular visibilidad según cadencia
      const resultado = await determinarVisibilidadPorCadencia(section, itemId, rutina);
      
      // DEBUGGING: Mostrar resultado de visibilidad
      console.log(`[SHOW_ITEM] Resultado para ${section}.${itemId}: ${resultado ? 'MOSTRAR' : 'OCULTAR'}`);
      
      // Guardar en cache
      cacheVisibilidad[claveCache] = {
        visible: resultado,
        timestamp: Date.now(),
        razon: "calculo_completo"
      };
      
      return resultado;
    }
    
    // 4. Para rutinas futuras, mostrar todo
    console.log(`[SHOW_ITEM] ${section}.${itemId}: Es rutina futura, se muestra siempre`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Error determinando visibilidad para ${section}.${itemId}:`, error);
    // En caso de error, mostrar el ítem por defecto
    return true;
  }
}

/**
 * Verifica si un ítem es válido y activo para ser mostrado
 * @param {string} section Sección del ítem
 * @param {string} itemId Identificador del ítem
 * @param {Object} rutina Objeto de rutina completo
 * @returns {boolean} Verdadero si el ítem es válido y activo
 */
function esItemValido(section, itemId, rutina) {
  // Verificar si hay configuración para el ítem
  if (!rutina?.config?.[section]?.[itemId]) {
    return true; // Si no hay configuración, mostrar por defecto
  }

  // Obtener la configuración del ítem
  const itemConfig = rutina.config[section][itemId];

  // Si el ítem no está activo, no mostrarlo
  if (itemConfig && itemConfig.activo === false) {
    return false;
  }
  
  return true;
}

/**
 * Punto 7 y 9: Determina si un ítem debe mostrarse en la vista principal basado en cadencia
 * @param {string} section Sección del ítem
 * @param {string} itemId Identificador del ítem
 * @param {Object} rutina Objeto de rutina
 * @returns {Promise<boolean>} Promesa con verdadero si el ítem debe mostrarse
 */
async function determinarVisibilidadPorCadencia(section, itemId, rutina) {
  // VERIFICACIÓN 1: Verificar estado actual en la UI (prioridad máxima)
  const estadoActualUI = !!rutina[section]?.[itemId];
  
  // IMPORTANTE: Si acaba de desmarcarse, siempre mostrar inmediatamente
  // Esto evita que el ítem desaparezca y luego reaparezca
  if (!estadoActualUI && rutina._ultimosCambios && 
      rutina._ultimosCambios[section]) {
    
    const ultimoCambio = rutina._ultimosCambios[section][itemId];
    if (ultimoCambio && 
        (ultimoCambio === false || (typeof ultimoCambio === 'object' && ultimoCambio.valor === false))) {
      
      // Si el cambio fue reciente (menos de 5 segundos), siempre mostrar
      const timestamp = typeof ultimoCambio === 'object' ? ultimoCambio.timestamp : Date.now();
      const esReciente = (Date.now() - timestamp) < 5000; // 5 segundos
      
      if (esReciente) {
        console.log(`[CADENCIA-RAPIDA] ${section}.${itemId}: Recién desmarcado (hace ${Math.round((Date.now() - timestamp)/1000)}s), mostrando inmediatamente`);
        return true;
      }
    }
  }
  
  // Punto 1: Verificar si el ítem ya está completado hoy (siempre mostrar ítems completados hoy)
  // Usar una versión optimizada que responde más rápido a cambios de UI
  const completadoHoy = estadoActualUI && isRutinaDeHoy(rutina);
  if (completadoHoy) {
    console.log(`[CADENCIA] ${section}.${itemId}: Completado HOY, siempre se muestra`);
    return true;
  }
  
  // Punto 2, 3, 4, 5: Obtener información detallada de cadencia
  const estadoCadencia = await calcularEstadoCadencia(section, itemId, rutina);
  const itemConfig = rutina.config[section][itemId];
  const tipo = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
  
  // Mostrar información detallada para depuración
  console.log(`[CADENCIA] ${section}.${itemId} (${tipo}): ` +
    `Completadas ${estadoCadencia.completados} de ${estadoCadencia.requeridos} veces. ` +
    `Completa: ${estadoCadencia.completa ? 'SÍ' : 'NO'}, Estado UI: ${estadoActualUI ? 'MARCADO' : 'DESMARCADO'}`);
  
  // Punto 8: Prevenir que se oculte un ítem cuando se ha completado hoy
  if (estadoCadencia.completadoHoy) {
    console.log(`[CADENCIA] ${section}.${itemId}: Se completó HOY, mostrando`);
    return true;
  }
  
  // COMPORTAMIENTO ESPECIAL PARA ÍTEM RECIENTEMENTE DESMARCADO
  // Si hay historial pero acaba de desmarcarse, comprobar el tiempo
  if (!estadoActualUI && estadoCadencia.conteoSemana > 0) {
    console.log(`[CADENCIA] ${section}.${itemId}: Tiene historial pero está desmarcado, mostrando`);
    return true;
  }
  
  // CASOS ESPECIALES por tipo de cadencia
  if (tipo === 'DIARIO') {
    // Los diarios siempre se muestran si no están completados hoy
    console.log(`[CADENCIA] ${section}.${itemId}: Diario no completado, se muestra`);
    return true;
  } else if (tipo === 'SEMANAL' || tipo === 'MENSUAL') {
    // IMPORTANTE: Para ítems "GYM" y "baño" con cadencia semanal, siempre mostrar en la semana actual
    // Esta es una excepción específica para debugging
    if ((itemId.toLowerCase() === 'gym' || itemId.toLowerCase() === 'baño') && tipo === 'SEMANAL') {
      console.log(`[CADENCIA-ESPECIAL] ${section}.${itemId}: Ítem ${itemId.toUpperCase()} SEMANAL SIEMPRE VISIBLE PARA DEBUG`);
      return true;
    }
    
    // Punto 9: Si ya se cumplió el requisito en días anteriores y NO está marcado hoy, decidir si mostrar
    if (estadoCadencia.completa && !completadoHoy) {
      // COMPORTAMIENTO DIFERENTE: Los ítems que se desmarcan deben seguir visibles
      // para permitir volver a marcarlos en el mismo día
      if (!estadoActualUI && isRutinaDeHoy(rutina)) {
        console.log(`[CADENCIA] ${section}.${itemId}: Cadencia completa pero desmarcado HOY, se muestra para permitir remarcar`);
        return true;
      }
      
      console.log(`[CADENCIA] ${section}.${itemId}: Requisito ${tipo} ya satisfecho (${estadoCadencia.completados}/${estadoCadencia.requeridos}), NO se muestra`);
      
      // DEBUG temporal para verificar comportamiento
      console.log(`[CADENCIA-DEBUG] Detalles de completaciones:`, estadoCadencia.datosCompletacion);
      
      return false;
    }
    
    // Si no se ha cumplido el requisito, mostrar
    console.log(`[CADENCIA] ${section}.${itemId}: Requisito ${tipo} pendiente (${estadoCadencia.completados}/${estadoCadencia.requeridos}), se muestra`);
    return true;
  }
  
  // Valor por defecto: mostrar
  console.log(`[CADENCIA] ${section}.${itemId}: Tipo de cadencia no reconocido (${tipo}), se muestra por defecto`);
  return true;
}

/**
 * Punto 2, 3, 4, 5, 6: Calcula el estado detallado de la cadencia para un ítem
 */
async function calcularEstadoCadencia(section, itemId, rutina) {
  const itemConfig = rutina.config[section][itemId];
  const tipo = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
  const frecuencia = Number(itemConfig?.frecuencia || 1);
  
  // Punto 6: Obtener datos de completación integrando el historial
  const datosCompletacion = await obtenerDatosCompletacionDetallados(rutina, section, itemId);
  
  // DEBUG: Mostrar datos de completación para diagnóstico
  console.log(`[CADENCIA] Datos completación para ${section}.${itemId}:`, {
    conteoHoy: datosCompletacion.conteoHoy,
    conteoSemana: datosCompletacion.conteoSemana,
    fechasCompletadas: datosCompletacion.todasLasCompletaciones.map(f => f.toISOString().split('T')[0])
  });
  
  // Conteo basado en tipo de cadencia
  let completadosEnPeriodo = 0;
  
  if (tipo === 'DIARIO') {
    completadosEnPeriodo = datosCompletacion.conteoHoy;
  } else if (tipo === 'SEMANAL') {
    // Para casos SEMANAL, siempre usar el conteo calculado por obtenerDatosCompletacionDetallados
    // que ya tiene en cuenta todas las completaciones de la semana correctamente
    completadosEnPeriodo = datosCompletacion.conteoSemana;
    
    // DEBUG: Mostrar información adicional para diagnóstico
    console.log(`[CADENCIA-SEMANAL] ${section}.${itemId}: Conteo semana = ${completadosEnPeriodo}`);
  } else {
    // Para otros tipos, usar el conteo que corresponda
    completadosEnPeriodo = contarCompletacionesEnPeriodo(datosCompletacion.todasLasCompletaciones, tipo);
  }
  
  // Verificar si se ha completado el requisito
  const cumpleCadencia = completadosEnPeriodo >= frecuencia;
  
  // Generar texto descriptivo para mostrar en UI
  const periodoActual = determinarPeriodoActual(tipo);
  const textoDescriptivo = generarTextoEstadoCadencia(
    tipo, 
    completadosEnPeriodo, 
    frecuencia, 
    periodoActual.etiqueta
  );
  
  console.log(`[CADENCIA] Estado para ${section}.${itemId}: ${textoDescriptivo} (${completadosEnPeriodo}/${frecuencia})`);
  
  return {
    tipo,
    frecuencia,
    completados: completadosEnPeriodo,
    requeridos: frecuencia,
    completa: cumpleCadencia,
    completadoHoy: datosCompletacion.completadoHoy,
    periodoActual: periodoActual.etiqueta,
    periodoInfo: periodoActual,
    porcentaje: frecuencia > 0 ? Math.min(100, Math.round((completadosEnPeriodo / frecuencia) * 100)) : 0,
    datosCompletacion,
    texto: textoDescriptivo
  };
}

/**
 * Punto 1, 6: Obtiene datos detallados sobre las completaciones de un ítem, incluyendo hoy y el historial
 * @param {Object} rutina - Objeto de rutina
 * @param {string} section - Sección del ítem
 * @param {string} itemId - ID del ítem
 * @returns {Promise<Object>} Datos de completación
 */
async function obtenerDatosCompletacionDetallados(rutina, section, itemId) {
  // Arrays para almacenar las fechas de completación
  const todasLasCompletaciones = [];  // Todas las completaciones históricas
  const completacionesHoy = [];       // Solo completaciones de hoy
  const completacionesSemanaActual = []; // Completaciones de esta semana
  let completadoHoy = false;          // Bandera para verificar si se completó hoy
  
  // Obtener fecha actual para comparaciones
  const hoy = new Date();
  const inicioSemanaActual = startOfWeek(hoy, { locale: es });
  const finSemanaActual = endOfWeek(hoy, { locale: es });
  
  console.log(`[HISTORIAL] Analizando ${section}.${itemId} para rutina con fecha ${rutina.fecha}`);
  console.log(`[HISTORIAL] Rango semana: ${inicioSemanaActual.toISOString().split('T')[0]} - ${finSemanaActual.toISOString().split('T')[0]}`);
  
  // CASO ESPECIAL: Para el ítem "gym", hacer logging adicional 
  const esGym = itemId.toLowerCase() === 'gym';
  const esImportante = esGym || itemId.toLowerCase() === 'baño';
  if (esImportante) {
    console.log(`[ÍTEM-ESPECIAL] Iniciando análisis detallado para ítem ${itemId.toUpperCase()} en ${section}`);
  }
  
  // IMPORTANTE: Comprobar primero el estado ACTUAL de la UI antes de consultar historial
  // Esto garantiza que si acabo de marcar/desmarcar, el estado se refleje inmediatamente
  // PARTE 1: Verificar la rutina actual primero (siempre usar datos locales para la rutina actual)
  const estaCompletadoActualmente = !!rutina[section]?.[itemId];
  
  if (estaCompletadoActualmente) {
    const fechaRutina = typeof rutina.fecha === 'string' ? parseISO(rutina.fecha) : rutina.fecha;
    const fechaStr = fechaRutina.toISOString().split('T')[0];
    
    // Forzar inclusión en todas las colecciones relevantes
    todasLasCompletaciones.push(fechaRutina);
    
    if (isToday(fechaRutina)) {
      completadoHoy = true;
      completacionesHoy.push(fechaRutina);
      console.log(`[HISTORIAL] ✅ Rutina actual completada HOY (${fechaStr})`);
    }
    
    if (estaEnMismaSemana(fechaRutina, hoy)) {
      completacionesSemanaActual.push(fechaRutina);
      console.log(`[HISTORIAL] ✅ Rutina actual en semana (${fechaStr})`);
      
      if (esImportante) {
        console.log(`[ÍTEM-ESPECIAL] Completación de ${itemId} detectada en rutina actual: ${fechaStr}`);
      }
    }
  } else {
    console.log(`[HISTORIAL] ❌ El ítem ${section}.${itemId} NO está marcado como completado en la rutina actual`);
    
    if (esImportante) {
      console.log(`[ÍTEM-ESPECIAL] ${itemId} NO está completado en la rutina actual`);
    }
    
    // Invalidar todos los cachés relacionados con este ítem para forzar recálculo
    // cuando se desmarca un ítem después de haber estado marcado
    Object.keys(cacheHistorialCompletaciones).forEach(key => {
      if (key.includes(`${section}_${itemId}`)) {
        console.log(`[CACHÉ] Invalidando caché para ${key} debido a desmarcado`);
        delete cacheHistorialCompletaciones[key];
      }
    });
    
    Object.keys(cacheVisibilidad).forEach(key => {
      if (key.includes(`${section}_${itemId}`)) {
        console.log(`[CACHÉ] Invalidando caché de visibilidad para ${key} debido a desmarcado`);
        delete cacheVisibilidad[key];
      }
    });
  }
  
  // PARTE 2: Obtener historial del backend para asegurar datos precisos
  try {
    // Crear clave única para este ítem y semana/mes actual
    const añoActual = hoy.getFullYear();
    const semanaActual = getWeek(hoy, { locale: es });
    const timestamp = Date.now();
    const claveCache = `${section}_${itemId}_${añoActual}_s${semanaActual}_${estaCompletadoActualmente}_${timestamp}`;
    
    // Para casos donde acaba de desmarcarse, siempre forzar reconsulta de historial
    // evitando usar caché por completo si recientemente se desmarcó
    const usarCache = estaCompletadoActualmente;
    
    // Verificar si tenemos datos en caché y si son recientes (menos de 1 segundo para datos críticos)
    const datosCacheados = usarCache ? cacheHistorialCompletaciones[claveCache] : null;
    const cacheExpirado = !datosCacheados || 
      ((Date.now() - datosCacheados.timestamp) > 1000); // 1 segundo
    
    let datosHistorial;
    
    if (datosCacheados && !cacheExpirado) {
      console.log(`[HISTORIAL] Usando datos cacheados para ${section}.${itemId}`);
      datosHistorial = datosCacheados.datos;
    } else {
      console.log(`[HISTORIAL] Obteniendo historial del backend para ${section}.${itemId}`);
      
      // Definir rango de fechas para la consulta (2 meses hacia atrás)
      const fechaInicio = subMonths(inicioSemanaActual, 2);
      const fechaFin = finSemanaActual;
      
      // Llamar al endpoint del backend
      datosHistorial = await rutinasService.getHistorialCompletaciones(
        section, 
        itemId, 
        fechaInicio, 
        fechaFin
      );
      
      // Actualizar caché solo si el ítem está marcado actualmente
      if (estaCompletadoActualmente) {
        cacheHistorialCompletaciones[claveCache] = {
          datos: datosHistorial,
          timestamp: Date.now()
        };
      }
      
      console.log(`[HISTORIAL] Recibidas ${datosHistorial?.completaciones?.length || 0} completaciones del backend`);
    }
    
    // Procesar completaciones recibidas
    if (datosHistorial && datosHistorial.completaciones) {
      datosHistorial.completaciones.forEach(comp => {
        const fechaComp = new Date(comp.fecha);
        const fechaCompStr = fechaComp.toISOString().split('T')[0];
        
        // IMPORTANTE: Para el día de hoy, solo contar si actualmente está marcado
        // Para evitar contar completaciones antiguas del mismo día cuando el ítem está desmarcado
        const esHoy = isToday(fechaComp);
        if (esHoy && !estaCompletadoActualmente) {
          console.log(`[HISTORIAL] ⚠️ Ignorando completación HOY desde historial (${fechaCompStr}) porque actualmente está desmarcado`);
          return; // saltar esta iteración
        }
        
        // Evitar duplicados si ya teníamos esta fecha en la rutina actual
        if (!todasLasCompletaciones.some(f => isSameDay(f, fechaComp))) {
          todasLasCompletaciones.push(fechaComp);
          
          // Verificar si está en el día actual
          if (esHoy && !completadoHoy) {
            completadoHoy = true;
            completacionesHoy.push(fechaComp);
            console.log(`[HISTORIAL] ✅ Completado HOY desde historial (${fechaCompStr})`);
          }
          
          // Verificar si está en la semana actual
          if (estaEnMismaSemana(fechaComp, hoy)) {
            completacionesSemanaActual.push(fechaComp);
            console.log(`[HISTORIAL] ✅ Completado en semana actual desde historial (${fechaCompStr})`);
            
            if (esImportante) {
              console.log(`[ÍTEM-ESPECIAL] Completación de ${itemId} en historial: ${fechaCompStr}`);
            }
          }
        }
      });
    }
  } catch (error) {
    console.error(`[HISTORIAL] Error al obtener historial del backend:`, error);
    
    // En caso de error, intentar usar el historial local como respaldo
    console.log(`[HISTORIAL] Usando historial local como respaldo`);
    
    // IMPORTANTE: Para el día de hoy, respetar SIEMPRE el estado actual de la UI
    // para evitar inconsistencias al marcar/desmarcar varias veces

    // Usar el historial de la rutina actual si está disponible
    if (rutina.historial && typeof rutina.historial === 'object') {
      // Revisar historial por sección
      if (rutina.historial[section]) {
        Object.entries(rutina.historial[section]).forEach(([fecha, items]) => {
          // Para días pasados, usar historial normal
          // Para hoy, solo usar si actualmente está marcado
          const fechaObj = parseISO(fecha);
          const fechaStr = fecha.split('T')[0];
          const esHoy = isToday(fechaObj);
          
          if (items?.[itemId] && (!esHoy || estaCompletadoActualmente)) {
            // Evitar duplicados
            if (!todasLasCompletaciones.some(f => isSameDay(f, fechaObj))) {
              todasLasCompletaciones.push(fechaObj);
              
              if (esHoy) {
                completadoHoy = true;
                completacionesHoy.push(fechaObj);
              }
              
              if (estaEnMismaSemana(fechaObj, hoy)) {
                completacionesSemanaActual.push(fechaObj);
                
                if (esImportante) {
                  console.log(`[ÍTEM-ESPECIAL] ${itemId} en historial local (sección): ${fechaStr}`);
                }
              }
            }
          }
        });
      }
      
      // Revisar historial por rutinas
      if (Array.isArray(rutina.historial.rutinas)) {
        rutina.historial.rutinas.forEach(rutinaHist => {
          const fechaObj = typeof rutinaHist.fecha === 'string' ? parseISO(rutinaHist.fecha) : rutinaHist.fecha;
          const fechaStr = fechaObj.toISOString().split('T')[0];
          const esHoy = isToday(fechaObj);
          
          if (rutinaHist[section]?.[itemId] && (!esHoy || estaCompletadoActualmente)) {
            // Evitar duplicados
            if (!todasLasCompletaciones.some(f => isSameDay(f, fechaObj))) {
              todasLasCompletaciones.push(fechaObj);
              
              if (esHoy) {
                completadoHoy = true;
                completacionesHoy.push(fechaObj);
              }
              
              if (estaEnMismaSemana(fechaObj, hoy)) {
                completacionesSemanaActual.push(fechaObj);
                
                if (esImportante) {
                  console.log(`[ÍTEM-ESPECIAL] ${itemId} en historial local (rutinas): ${fechaStr}`);
                }
              }
            }
          }
        });
      }
    }
  }
  
  // IMPORTANTE: Actualizar el estado de completadoHoy basado en el estado actual de la UI
  // para el caso donde se ha desmarcado y remarcado varias veces
  completadoHoy = estaCompletadoActualmente && isToday(new Date(rutina.fecha));
  
  // Eliminar duplicados por fecha y ordenar
  const fechasUnicas = eliminarDuplicadosPorFecha(todasLasCompletaciones);
  const fechasHoyUnicas = eliminarDuplicadosPorFecha(completacionesHoy);
  const fechasSemanaUnicas = eliminarDuplicadosPorFecha(completacionesSemanaActual);
  
  // Para desmarques, asegurar que el conteo de hoy sea 0 o respete el estado actual
  if (!estaCompletadoActualmente) {
    const conteoHoyAjustado = completadoHoy ? 1 : 0;
    console.log(`[HISTORIAL] ⚠️ Ajustando conteo de HOY a ${conteoHoyAjustado} porque el ítem está desmarcado`);
  }
  
  // Resumen para depuración
  console.log(`[HISTORIAL] Resultado final para ${section}.${itemId}:`, {
    totalCompletaciones: fechasUnicas.length,
    completadoHoy: completadoHoy,
    conteoHoy: fechasHoyUnicas.length,
    conteoSemana: fechasSemanaUnicas.length,
    fechasSemana: fechasSemanaUnicas.map(f => f.toISOString().split('T')[0]),
    estadoActualUI: estaCompletadoActualmente ? 'COMPLETADO' : 'NO COMPLETADO'
  });
  
  // CASO ESPECIAL para ítems importantes: mostrar más detalles
  if (esImportante) {
    console.log(`[ÍTEM-ESPECIAL] Resultado final ${itemId}: ${fechasSemanaUnicas.length} completaciones esta semana (Completado hoy: ${completadoHoy})`);
  }
  
  return {
    todasLasCompletaciones: fechasUnicas,
    completacionesHoy: fechasHoyUnicas,
    completacionesSemanaActual: fechasSemanaUnicas,
    completadoHoy,
    conteoHoy: completadoHoy ? Math.max(1, fechasHoyUnicas.length) : 0, // Siempre reflejar estado actual
    conteoSemana: fechasSemanaUnicas.length,
    estadoActualUI: estaCompletadoActualmente
  };
}

/**
 * Auxiliar: Verifica si una fecha está en la misma semana que otra, 
 * usando lógica inclusiva para inicio y fin de semana
 */
function estaEnMismaSemana(fecha1, fecha2) {
  // Asegurar que las fechas sean objetos Date
  const fechaObj1 = typeof fecha1 === 'string' ? parseISO(fecha1) : fecha1;
  const fechaObj2 = typeof fecha2 === 'string' ? parseISO(fecha2) : fecha2;
  
  // Verificar si los años son diferentes
  const año1 = fechaObj1.getFullYear();
  const año2 = fechaObj2.getFullYear();
  
  // Si los años son muy diferentes, definitivamente no es la misma semana
  if (Math.abs(año1 - año2) > 1) {
    return false;
  }
  
  // Para fechas cercanas al cambio de año, usamos lógica especial
  const inicioSemana = startOfDay(startOfWeek(fechaObj2, { locale: es }));
  const finSemana = endOfDay(endOfWeek(fechaObj2, { locale: es }));
  
  // Conversión a tiempo Unix para comparación más precisa
  const tiempoFecha1 = fechaObj1.getTime();
  const tiempoInicioSemana = inicioSemana.getTime();
  const tiempoFinSemana = finSemana.getTime();
  
  // Debugging especial para detectar problemas con fechas
  const esInicioOFinSemana = isSameDay(fechaObj1, inicioSemana) || isSameDay(fechaObj1, finSemana);
  
  if (esInicioOFinSemana) {
    console.log(`[SEMANA-ESPECIAL] Fecha ${fechaObj1.toISOString().split('T')[0]} es inicio o fin de semana`);
  }
  
  // Comprobar si la fecha está entre el inicio y fin de semana, inclusive
  const dentroDeRango = tiempoFecha1 >= tiempoInicioSemana && tiempoFecha1 <= tiempoFinSemana;
  
  // Debugging adicional para GYM
  if (dentroDeRango) {
    console.log(`[SEMANA] Fecha ${fechaObj1.toISOString().split('T')[0]} está en la semana de ${fechaObj2.toISOString().split('T')[0]}`);
  }
  
  return dentroDeRango;
}

/**
 * Auxiliar: Elimina fechas duplicadas comparando por día
 */
function eliminarDuplicadosPorFecha(fechas) {
  const fechasUnicas = [];
  const diasRegistrados = new Set();
  
  fechas.forEach(fecha => {
    const diaKey = fecha.toISOString().split('T')[0];
    if (!diasRegistrados.has(diaKey)) {
      diasRegistrados.add(diaKey);
      fechasUnicas.push(fecha);
    }
  });
  
  return fechasUnicas.sort(compareAsc);
}

/**
 * Determina el período actual basado en el tipo de cadencia
 * @param {string} tipo Tipo de cadencia (DIARIO, SEMANAL, MENSUAL)
 * @returns {Object} Información sobre el período actual
 */
function determinarPeriodoActual(tipo) {
  const hoy = new Date();
  
  switch (tipo) {
    case 'DIARIO': {
      return {
        tipo: 'diario',
        etiqueta: 'hoy',
        inicio: startOfDay(hoy),
        fin: hoy,
        formatoFecha: 'dd/MM/yyyy'
      };
    }
    
    case 'SEMANAL': {
      const inicioSemana = startOfWeek(hoy, { locale: es });
      const finSemana = endOfWeek(hoy, { locale: es });
      return {
        tipo: 'semanal',
        etiqueta: 'esta semana',
        inicio: inicioSemana,
        fin: finSemana,
        semana: getWeek(hoy, { locale: es }),
        formatoFecha: "'Semana' w, yyyy"
      };
    }
    
    case 'MENSUAL': {
      const inicioMes = startOfMonth(hoy);
      const finMes = endOfMonth(hoy);
      return {
        tipo: 'mensual',
        etiqueta: 'este mes',
        inicio: inicioMes,
        fin: finMes,
        mes: getMonth(hoy),
        año: getYear(hoy),
        formatoFecha: 'MMMM yyyy'
      };
    }
    
    default: {
      return {
        tipo: 'desconocido',
        etiqueta: 'período actual',
        inicio: startOfDay(hoy),
        fin: hoy,
        formatoFecha: 'dd/MM/yyyy'
      };
    }
  }
}

/**
 * Cuenta el número de completaciones en el período actual
 * @param {Array} completaciones Lista de fechas de completación
 * @param {string} tipo Tipo de cadencia (DIARIO, SEMANAL, MENSUAL)
 * @returns {number} Número de completaciones en el período actual
 */
function contarCompletacionesEnPeriodo(completaciones, tipo) {
  if (!completaciones || completaciones.length === 0) {
    return 0;
  }
  
  // Simplemente usar el largo del array, ya que ya hemos filtrado correctamente
  return completaciones.length;
}

/**
 * Genera un texto descriptivo del estado de cadencia
 * @param {string} tipo Tipo de cadencia
 * @param {number} completados Número de veces completado
 * @param {number} requeridos Número de veces requerido
 * @param {string} periodo Etiqueta del período actual
 * @returns {string} Texto descriptivo
 */
function generarTextoEstadoCadencia(tipo, completados, requeridos, periodo) {
  // Para todo tipo de cadencia, siempre mostrar el formato "X de Y veces periodo"
  if (tipo === 'DIARIO') {
    if (completados >= requeridos) {
      return `Completado ${periodo} (${completados}/${requeridos})`;
    } else {
      return `${completados} de ${requeridos} ${periodo}`;
    }
  } else if (tipo === 'SEMANAL') {
    // Mostrar siempre con formato "X de Y"
    if (completados === 0) {
      return `0 de ${requeridos} veces ${periodo}`;
    } else if (completados === 1) {
      return `1 de ${requeridos} veces ${periodo}`;
    } else if (completados < requeridos) {
      return `${completados} de ${requeridos} veces ${periodo}`;
    } else {
      // Si está completo, mostrar un mensaje más positivo pero manteniendo el conteo
      return `¡Completo! ${completados}/${requeridos} veces ${periodo}`;
    }
  } else if (tipo === 'MENSUAL') {
    // Usar formato similar para mensual
    if (completados === 0) {
      return `0 de ${requeridos} veces ${periodo}`;
    } else if (completados === 1) {
      return `1 de ${requeridos} veces ${periodo}`;
    } else if (completados < requeridos) {
      return `${completados} de ${requeridos} veces ${periodo}`;
    } else {
      return `¡Completo! ${completados}/${requeridos} veces ${periodo}`;
    }
  }
  
  // Mensaje genérico para otros tipos de cadencia
  return `${completados} de ${requeridos} veces ${periodo}`;
}

/**
 * Verifica si dos fechas están en la misma semana
 * @param {Date} fecha1 Primera fecha
 * @param {Date} fecha2 Segunda fecha
 * @returns {boolean} Verdadero si están en la misma semana
 */
function esMismaSemana(fecha1, fecha2) {
  return dfsIsSameWeek(fecha1, fecha2, { locale: es });
}

/**
 * Verifica si dos fechas están en el mismo mes
 * @param {Date} fecha1 Primera fecha
 * @param {Date} fecha2 Segunda fecha
 * @returns {boolean} Verdadero si están en el mismo mes
 */
function esMismoMes(fecha1, fecha2) {
  return (
    getMonth(fecha1) === getMonth(fecha2) && 
    getYear(fecha1) === getYear(fecha2)
  );
}

/**
 * Verifica si un ítem ha sido completado hoy en la rutina actual
 * @param {Object} rutina Datos de la rutina
 * @param {string} section Sección del ítem
 * @param {string} itemId Identificador del ítem
 * @returns {boolean} Verdadero si el ítem está completado en la rutina de hoy
 */
function isItemCompletadoHoy(rutina, section, itemId) {
  if (!rutina || !isRutinaDeHoy(rutina)) return false;
  return !!rutina[section]?.[itemId];
}

/**
 * Obtiene las fechas en que se completó un ítem específico
 * @param {Object} rutina Datos de la rutina
 * @param {string} section Sección del ítem
 * @param {string} itemId Identificador del ítem
 * @returns {Array} Lista de fechas en que se completó el ítem
 */
function obtenerCompletacionesHistoricas(rutina, section, itemId) {
  const completaciones = [];
  
  // Verificar si la rutina actual tiene el ítem completado
  if (rutina[section]?.[itemId]) {
    const fechaRutina = typeof rutina.fecha === 'string'
      ? parseISO(rutina.fecha)
      : rutina.fecha;
    completaciones.push(fechaRutina);
  }
  
  // Verificar historial de la rutina
  if (rutina.historial?.[section]) {
    Object.entries(rutina.historial[section]).forEach(([fecha, items]) => {
      if (items?.[itemId]) {
        completaciones.push(parseISO(fecha));
      }
    });
  }
  
  return completaciones;
}

/**
 * Determina si la rutina es del día actual
 * @param {Object} rutina Datos de la rutina
 * @returns {boolean} Verdadero si es la rutina de hoy
 */
function isRutinaDeHoy(rutina) {
  if (!rutina || !rutina.fecha) return false;
  const rutinaFecha = typeof rutina.fecha === 'string' 
    ? parseISO(rutina.fecha) 
    : rutina.fecha;
  return isToday(rutinaFecha);
}

/**
 * Determina si la rutina es de una fecha pasada
 * @param {Object} rutina Datos de la rutina
 * @returns {boolean} Verdadero si es una rutina pasada
 */
function isRutinaPasada(rutina) {
  if (!rutina || !rutina.fecha) return false;
  const rutinaFecha = typeof rutina.fecha === 'string' 
    ? parseISO(rutina.fecha) 
    : rutina.fecha;
  return isBefore(startOfDay(rutinaFecha), startOfDay(new Date()));
}

/**
 * Determina si la rutina es de una fecha futura
 * @param {Object} rutina Datos de la rutina
 * @returns {boolean} Verdadero si es una rutina futura
 */
function isRutinaFutura(rutina) {
  if (!rutina || !rutina.fecha) return false;
  const rutinaFecha = typeof rutina.fecha === 'string' 
    ? parseISO(rutina.fecha) 
    : rutina.fecha;
  return !isToday(rutinaFecha) && !isBefore(rutinaFecha, new Date());
}

// Exportar funciones adicionales para pruebas y uso externo
export {
  calcularEstadoCadencia,
  obtenerDatosCompletacionDetallados,
  determinarPeriodoActual,
  contarCompletacionesEnPeriodo,
  generarTextoEstadoCadencia
};

export default shouldShowItem; 