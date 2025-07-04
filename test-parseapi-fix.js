/**
 * Script de test para verificar el fix de parseAPIDate
 * 
 * Problema original:
 * - Backend devuelve: "2025-07-01T00:00:00.000Z"
 * - Frontend mostraba: "30 de junio" (incorrecto)
 * - Debería mostrar: "1 de julio" (correcto)
 */

// Simulación de la función parseAPIDate corregida
const parseAPIDate = (date) => {
  if (!date) return null;
  
  try {
    let year, month, day;
    
    // Si ya es un objeto Date, NO hacer conversiones de timezone
    if (date instanceof Date) {
      // Usar getUTC* para extraer los componentes de fecha como fueron guardados
      year = date.getUTCFullYear();
      month = date.getUTCMonth();
      day = date.getUTCDate();
    }
    // Si es string, parsear directamente sin conversiones
    else {
      const dateStr = String(date);
      
      // Para formato YYYY-MM-DD (más común desde el backend)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        year = y;
        month = m - 1; // Ajustar mes (0-11)
        day = d;
      }
      // Para formato ISO (desde el backend: 2025-07-01T00:00:00.000Z)
      else if (dateStr.includes('T')) {
        // Extraer solo la parte de la fecha, ignorar la parte de tiempo y timezone
        const datePart = dateStr.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = datePart.split('-').map(Number);
          year = y;
          month = m - 1; // Ajustar mes (0-11)
          day = d;
        } else {
          // Fallback: usar Date constructor pero extraer como UTC
          const d = new Date(dateStr);
          year = d.getUTCFullYear();
          month = d.getUTCMonth();
          day = d.getUTCDate();
        }
      }
      // Último recurso: parseo directo
      else {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          console.warn('[dateUtils] Formato de fecha no reconocido:', dateStr);
          return null;
        }
        
        // Usar componentes UTC para evitar conversiones de timezone
        year = d.getUTCFullYear();
        month = d.getUTCMonth();
        day = d.getUTCDate();
      }
    }
    
    // Crear fecha local a mediodía para evitar problemas con DST
    // Esta fecha representará el día específico sin importar el timezone
    const parsed = new Date(year, month, day, 12, 0, 0, 0);
    
    console.log('[TEST] parseAPIDate:', {
      input: date,
      inputType: typeof date,
      extractedComponents: { year, month: month + 1, day }, // Mostrar mes 1-12 para debug
      resultDate: parsed.toISOString(),
      resultLocal: parsed.toDateString(),
      explanation: `Entrada "${date}" parseada como día ${day}/${month + 1}/${year}`
    });
    
    return parsed;
  } catch (error) {
    console.error('[TEST] Error en parseAPIDate:', error);
    return null;
  }
};

// Función para formatear fecha de forma legible
const formatDateDisplay = (date) => {
  if (!date) return 'Sin fecha';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Santiago' // Para mostrar en timezone del usuario
  };
  
  return new Intl.DateTimeFormat('es-ES', options).format(date);
};

// Test cases
console.log('🧪 TESTING parseAPIDate FIX');
console.log('============================');

// Caso 1: Fecha ISO desde el backend (el caso problemático)
console.log('\n📋 CASO 1: Fecha ISO desde backend');
const fechaBackend = "2025-07-01T00:00:00.000Z";
const parsed1 = parseAPIDate(fechaBackend);
console.log('✅ Resultado:', formatDateDisplay(parsed1));
console.log('🎯 Esperado: 1 de julio de 2025');

// Caso 2: Fecha YYYY-MM-DD
console.log('\n📋 CASO 2: Fecha YYYY-MM-DD');
const fechaSimple = "2025-07-01";
const parsed2 = parseAPIDate(fechaSimple);
console.log('✅ Resultado:', formatDateDisplay(parsed2));
console.log('🎯 Esperado: 1 de julio de 2025');

// Caso 3: Objeto Date
console.log('\n📋 CASO 3: Objeto Date');
const fechaObject = new Date("2025-07-01T00:00:00.000Z");
const parsed3 = parseAPIDate(fechaObject);
console.log('✅ Resultado:', formatDateDisplay(parsed3));
console.log('🎯 Esperado: 1 de julio de 2025');

// Caso 4: Comparación con el comportamiento anterior (problemático)
console.log('\n📋 CASO 4: Comparación con comportamiento anterior');
const fechaProblematica = "2025-07-01T00:00:00.000Z";
const dateOld = new Date(fechaProblematica); // Comportamiento anterior problemático

console.log('❌ Comportamiento anterior (Date constructor directo):');
console.log('   ', formatDateDisplay(dateOld));
console.log('   ', 'Timezone offset:', dateOld.getTimezoneOffset(), 'minutos');

console.log('✅ Comportamiento nuevo (parseAPIDate corregido):');
const dateNew = parseAPIDate(fechaProblematica);
console.log('   ', formatDateDisplay(dateNew));

// Verificación final
console.log('\n🎯 VERIFICACIÓN FINAL');
console.log('====================');
const isCorrect = formatDateDisplay(parsed1).includes('julio');
console.log(`✅ Test ${isCorrect ? 'PASSED' : 'FAILED'}: ${formatDateDisplay(parsed1)}`);

if (isCorrect) {
  console.log('🎉 ¡El fix funciona correctamente!');
  console.log('   Las fechas del backend ahora se muestran correctamente.');
} else {
  console.log('❌ El fix necesita más ajustes.');
}

console.log('\n📊 RESUMEN:');
console.log(`   Input: "${fechaBackend}"`);
console.log(`   Output: "${formatDateDisplay(parsed1)}"`);
console.log(`   Status: ${isCorrect ? 'CORRECTO' : 'NECESITA AJUSTES'}`); 