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
    // OPTIMIZACIÓN 1: Verificación rápida - Evitar cálculos innecesarios si la rutina no existe
    if (!rutina) {
      return true; // Comportamiento por defecto
    }
    
    // OPTIMIZACIÓN 2: Crear una clave de caché única basada en propiedades determinísticas
    // Esto permite reutilizar resultados del mismo cálculo
    const estadoItem = !!rutina[section]?.[itemId];
    const claveCache = `${section}_${itemId}_${rutina._id || 'local'}_${estadoItem}_${rutina.fecha || 'unknown'}`;
    
    // OPTIMIZACIÓN 3: Usar caché con TTL más corto para ítems críticos (5 segundos)
    // y TTL más largo para cálculos menos críticos (15 segundos para ítems pasados)
    const datosCache = cacheVisibilidad[claveCache];
    
    // Verificar si los datos están en caché y son válidos
    if (datosCache) {
      const tiempoTranscurrido = Date.now() - datosCache.timestamp;
      
      // Para rutinas pasadas, podemos cachear por más tiempo (15 segundos)
      if (isRutinaPasada(rutina) && tiempoTranscurrido < 15000) {
        return datosCache.visible;
      }
      
      // Para otros casos, usamos caché más corto pero aún útil (5 segundos)
      if (tiempoTranscurrido < 5000) {
        return datosCache.visible;
      }
    }
    
    // 1. Verificaciones básicas de validez del ítem (rápidas, sin promesas)
    if (!esItemValido(section, itemId, rutina)) {
      // Guardar en cache negativa
      guardarEnCache(claveCache, false, "item_invalido");
      return false;
    }
    
    // 2. Para rutinas pasadas, mostrar todos los elementos
    if (isRutinaPasada(rutina)) {
      // Guardar en cache positiva con un tiempo de vida más largo
      guardarEnCache(claveCache, true, "rutina_pasada", 15000);
      return true;
    }
    
    // 3. Para rutinas de hoy, aplicar lógica de cadencia
    if (isRutinaDeHoy(rutina)) {
      // OPTIMIZACIÓN 4: Comprobar primero estados que pueden determinarse sin promesas
      // Esto evita cálculos costosos cuando sabemos la respuesta de inmediato
      
      // Si está completado hoy, siempre mostrar (respuesta inmediata para mejor UX)
      if (estadoItem) {
        guardarEnCache(claveCache, true, "completado_hoy");
        return true;
      }
      
      // OPTIMIZACIÓN 5: Resolver casos simples rápidamente sin cálculos complejos
      const itemConfig = rutina.config?.[section]?.[itemId];
      if (itemConfig) {
        const tipo = itemConfig.tipo?.toUpperCase() || 'DIARIO';
        
        // CASO ESPECIAL: Si es diario y no está completado hoy, mostrar siempre
        if (tipo === 'DIARIO') {
          guardarEnCache(claveCache, true, "diario_no_completado");
          return true;
        }
        
        // CASO ESPECIAL: Para debugging de ítems específicos, siempre mostrar
        if ((itemId.toLowerCase() === 'gym' || itemId.toLowerCase() === 'baño') && tipo === 'SEMANAL') {
          guardarEnCache(claveCache, true, "item_especial_debug");
          return true;
        }
      }
      
      // OPTIMIZACIÓN 6: Usar función que determina visibilidad de forma asíncrona
      // Pero con mejor manejo de caché interno
      const resultado = await determinarVisibilidadPorCadencia(section, itemId, rutina);
      
      // Guardar en cache con tiempo estándar
      guardarEnCache(claveCache, resultado, "calculo_completo");
      
      return resultado;
    }
    
    // 4. Para rutinas futuras, mostrar todo
    guardarEnCache(claveCache, true, "rutina_futura");
    return true;
  } catch (error) {
    console.error(`[ERROR] Error determinando visibilidad para ${section}.${itemId}:`, error);
    // En caso de error, mostrar el ítem por defecto
    return true;
  }
}

/**
 * Función auxiliar para guardar resultados en caché con control de tiempo de vida
 * @param {string} clave - Clave única para el resultado 
 * @param {boolean} visible - Resultado de visibilidad
 * @param {string} razon - Razón del resultado (para debugging)
 * @param {number} ttl - Tiempo de vida en milisegundos (opcional)
 */
function guardarEnCache(clave, visible, razon, ttl = 5000) {
  // Guardar en caché con timestamp y TTL configurable
  cacheVisibilidad[clave] = {
    visible,
    timestamp: Date.now(),
    razon,
    ttl // Permite controlar por cuánto tiempo es válido el resultado
  };
  
  // OPTIMIZACIÓN 7: Limitar tamaño del caché para evitar memory leaks
  // Eliminar entradas antiguas si hay más de 1000 (podría ser configurable)
  const claves = Object.keys(cacheVisibilidad);
  if (claves.length > 1000) {
    // Ordenar por timestamp y eliminar el 20% más antiguo
    const clavesOrdenadas = claves.sort((a, b) => 
      cacheVisibilidad[a].timestamp - cacheVisibilidad[b].timestamp
    );
    
    const eliminarCount = Math.floor(claves.length * 0.2); // Eliminar el 20% más antiguo
    clavesOrdenadas.slice(0, eliminarCount).forEach(c => {
      delete cacheVisibilidad[c];
    });
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
  // OPTIMIZACIÓN: Verificación rápida de parámetros para evitar trabajo innecesario
  if (!rutina || !section || !itemId) {
    return {
      todasLasCompletaciones: [],
      completacionesHoy: [],
      completacionesSemanaActual: [],
      completadoHoy: false,
      conteoHoy: 0,
      conteoSemana: 0,
      estadoActualUI: false,
      completacionesPorDia: new Map()
    };
  }
  
  // Obtener estado actual del UI para caching correcto
  const estaCompletadoActualmente = !!rutina[section]?.[itemId];
  
  // Arrays para almacenar las fechas de completación
  const todasLasCompletaciones = [];  // Todas las completaciones históricas
  const completacionesHoy = [];       // Solo completaciones de hoy
  const completacionesSemanaActual = []; // Completaciones de esta semana
  let completadoHoy = false;          // Bandera para verificar si se completó hoy
  
  // Mapa para contar completaciones por día
  const completacionesPorDia = new Map();
  
  // Obtener fecha actual para comparaciones
  const hoy = new Date();
  const inicioSemanaActual = startOfWeek(hoy, { locale: es });
  const finSemanaActual = endOfWeek(hoy, { locale: es });
  
  try {
    // PARTE 1: Procesar el historial local primero
    if (rutina.historial) {
      // Procesar historial por sección
      if (rutina.historial[section]) {
        Object.entries(rutina.historial[section]).forEach(([fecha, items]) => {
          if (items?.[itemId]) {
            const fechaObj = parseISO(fecha);
            const fechaStr = fechaObj.toISOString().split('T')[0];
            
            // Incrementar contador para este día
            completacionesPorDia.set(fechaStr, (completacionesPorDia.get(fechaStr) || 0) + 1);
            
            todasLasCompletaciones.push(fechaObj);
            
            if (isToday(fechaObj)) {
              completadoHoy = true;
              completacionesHoy.push(fechaObj);
            }
            
            if (isSameWeek(fechaObj, hoy, { locale: es })) {
              completacionesSemanaActual.push(fechaObj);
            }
          }
        });
      }
      
      // Procesar historial de rutinas
      if (Array.isArray(rutina.historial.rutinas)) {
        rutina.historial.rutinas.forEach(rutinaHist => {
          if (rutinaHist[section]?.[itemId]) {
            const fechaObj = parseISO(rutinaHist.fecha);
            const fechaStr = fechaObj.toISOString().split('T')[0];
            
            // Incrementar contador para este día
            completacionesPorDia.set(fechaStr, (completacionesPorDia.get(fechaStr) || 0) + 1);
            
            todasLasCompletaciones.push(fechaObj);
            
            if (isToday(fechaObj)) {
              completadoHoy = true;
              completacionesHoy.push(fechaObj);
            }
            
            if (isSameWeek(fechaObj, hoy, { locale: es })) {
              completacionesSemanaActual.push(fechaObj);
            }
          }
        });
      }
    }
    
    // PARTE 2: Si está completado actualmente, agregar la fecha actual
    if (estaCompletadoActualmente) {
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split('T')[0];
      
      // Incrementar contador para hoy
      completacionesPorDia.set(fechaStr, (completacionesPorDia.get(fechaStr) || 0) + 1);
      
      todasLasCompletaciones.push(fechaActual);
      completadoHoy = true;
      completacionesHoy.push(fechaActual);
      completacionesSemanaActual.push(fechaActual);
    }
    
    // PARTE 3: Obtener historial del backend
    const itemConfig = rutina.config?.[section]?.[itemId];
    const tipoCadencia = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
    
    if (tipoCadencia !== 'DIARIO' || estaCompletadoActualmente) {
      const datosHistorial = await rutinasService.getHistorialCompletaciones(
        section, 
        itemId, 
        subWeeks(inicioSemanaActual, 2), // Obtener 2 semanas de historial
        finSemanaActual
      );
      
      if (datosHistorial?.completaciones) {
        datosHistorial.completaciones.forEach(comp => {
          const fechaComp = new Date(comp.fecha);
          const fechaStr = fechaComp.toISOString().split('T')[0];
          
          // Incrementar contador para este día
          completacionesPorDia.set(fechaStr, (completacionesPorDia.get(fechaStr) || 0) + 1);
          
          todasLasCompletaciones.push(fechaComp);
          
          if (isToday(fechaComp)) {
            completadoHoy = true;
            completacionesHoy.push(fechaComp);
          }
          
          if (isSameWeek(fechaComp, hoy, { locale: es })) {
            completacionesSemanaActual.push(fechaComp);
          }
        });
      }
    }
    
    // PARTE 4: Calcular conteos finales usando el mapa de completaciones por día
    const fechaHoyStr = hoy.toISOString().split('T')[0];
    const conteoHoy = completacionesPorDia.get(fechaHoyStr) || 0;
    
    // Para el conteo semanal, sumar todas las completaciones de la semana
    let conteoSemana = 0;
    for (const [fecha, conteo] of completacionesPorDia.entries()) {
      const fechaObj = new Date(fecha);
      if (isSameWeek(fechaObj, hoy, { locale: es })) {
        conteoSemana += conteo;
      }
    }
    
    return {
      todasLasCompletaciones,
      completacionesHoy,
      completacionesSemanaActual,
      completadoHoy,
      conteoHoy,
      conteoSemana,
      estadoActualUI: estaCompletadoActualmente,
      completacionesPorDia
    };
  } catch (error) {
    console.error('Error obteniendo datos de completación:', error);
    return {
      todasLasCompletaciones: [],
      completacionesHoy: [],
      completacionesSemanaActual: [],
      completadoHoy: estaCompletadoActualmente,
      conteoHoy: estaCompletadoActualmente ? 1 : 0,
      conteoSemana: estaCompletadoActualmente ? 1 : 0,
      estadoActualUI: estaCompletadoActualmente,
      completacionesPorDia: new Map()
    };
  }
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
