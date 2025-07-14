import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CuotasProvider } from '../context/CuotasContext';
import EstadoFinanzasContrato from '../EstadoFinanzasContrato';
import { calcularEstadoFinanzasContrato } from '../contratoUtils';

/**
 * Ejemplo de cómo usar el sistema de cuotas actualizado en PropiedadCard
 * 
 * Este ejemplo demuestra:
 * 1. Cómo envolver EstadoFinanzasContrato con CuotasProvider
 * 2. Cómo los cambios inline se propagan automáticamente
 * 3. Cómo el estado visual se actualiza sin necesidad de refresh
 */
const ExamplePropiedadCardWithCuotas = ({ contrato, simboloMoneda = '$' }) => {
  // Calcular el estado inicial de finanzas
  const estadoFinanzas = calcularEstadoFinanzasContrato(contrato, simboloMoneda);

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Ejemplo: Estado de Cuotas Reactivo
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Los cambios inline en las cuotas se guardan automáticamente y actualizan
        el estado visual sin necesidad de refresh.
      </Typography>

      {/* Envolver con CuotasProvider para estado reactivo */}
      <CuotasProvider 
        contratoId={contrato._id || contrato.id}
        formData={contrato}
      >
        <EstadoFinanzasContrato 
          estadoFinanzas={estadoFinanzas} 
          contratoId={contrato._id || contrato.id} 
        />
      </CuotasProvider>

      <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          💡 <strong>Instrucciones:</strong>
        </Typography>
        <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#888' }}>
          <li>Haz clic en el botón de edición (lápiz) para activar el modo inline</li>
          <li>Modifica el estado de las cuotas usando los checkboxes</li>
          <li>Haz clic en "Guardar cambios" para persistir los cambios</li>
          <li>Observa cómo el estado visual se actualiza automáticamente</li>
        </ul>
      </Box>
    </Box>
  );
};

export default ExamplePropiedadCardWithCuotas; 