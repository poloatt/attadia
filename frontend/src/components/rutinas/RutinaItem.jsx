import React, { useState, useEffect } from 'react';

// Renderizar la descripción de cadencia
const renderCadenciaTexto = (config, itemId) => {
  if (!config || !config[section] || !config[section][itemId]) {
    return "1 vez por día"; // Valor por defecto si no hay configuración
  }
  
  const itemConfig = config[section][itemId];
  const tipo = itemConfig.tipo?.toUpperCase() || "DIARIO";
  const frecuencia = Number(itemConfig.frecuencia || 1);
  
  // Cargar datos de completación para mostrar progreso actual
  const [estadoCadencia, setEstadoCadencia] = useState(null);
  
  useEffect(() => {
    // Solo calcular para ítems activos
    if (!itemConfig.activo) return;
    
    const cargarEstadoCadencia = async () => {
      try {
        // Importar dinámicamente para evitar ciclos de dependencia
        const { calcularEstadoCadencia } = await import('./utils/shouldShowItem');
        const estado = await calcularEstadoCadencia(section, itemId, rutina);
        setEstadoCadencia(estado);
      } catch (error) {
        console.error(`Error al calcular estado de cadencia para ${section}.${itemId}:`, error);
      }
    };
    
    cargarEstadoCadencia();
  }, [rutina, section, itemId, itemConfig.activo]);
  
  // Mostrar texto básico mientras se carga o si hay error
  if (!estadoCadencia) {
    if (tipo === "DIARIO") {
      return `${frecuencia} ${frecuencia === 1 ? 'vez' : 'veces'} por día`;
    } else if (tipo === "SEMANAL") {
      return `${frecuencia} ${frecuencia === 1 ? 'vez' : 'veces'} por semana`;
    } else {
      return `${frecuencia} ${frecuencia === 1 ? 'vez' : 'veces'} por mes`;
    }
  }
  
  // Mostrar texto enriquecido con progreso actual
  return (
    <div className="cadencia-detalle">
      <span className="cadencia-texto">{estadoCadencia.texto || "Cargando..."}</span>
      {estadoCadencia.completados > 0 && (
        <span className="cadencia-progreso">
          ({estadoCadencia.completados}/{estadoCadencia.requeridos})
        </span>
      )}
    </div>
  );
};

// ... resto del componente ...

// En el return del componente, donde se muestra el texto de cadencia
return (
  // ... código existente ...
  <div className="item-name">
    {name}
    <div className="item-cadencia-info">
      {renderCadenciaTexto(rutina.config, itemId)}
    </div>
  </div>
  // ... código existente ...
); 
