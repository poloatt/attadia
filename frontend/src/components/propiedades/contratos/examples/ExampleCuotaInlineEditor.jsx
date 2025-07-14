import React from 'react';
import { Box, Typography } from '@mui/material';
import { useCuotaGuardado } from '../hooks/useCuotaGuardado';
import CuotaInlineEditor from '../CuotaInlineEditor';

const ExampleCuotaInlineEditor = ({ cuota, index, formData, editable = true }) => {
  const { actualizarYGuardarCuota, isLoading } = useCuotaGuardado();

  // Handler que actualiza el estado local y luego guarda en el backend
  const handleCuotaChange = async (cuotaActualizada) => {
    // Calcular solo los cambios (no toda la cuota)
    const cambios = {};
    if (cuotaActualizada.monto !== cuota.monto) cambios.monto = cuotaActualizada.monto;
    if (cuotaActualizada.estado !== cuota.estado) cambios.estado = cuotaActualizada.estado;
    
    // Usar el hook para actualizar y guardar automáticamente
    const exito = await actualizarYGuardarCuota(index, cambios);
    
    if (!exito) {
      console.error('Error al guardar la cuota');
      // Aquí podrías agregar una notificación de error
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
      <Typography variant="body2" sx={{ minWidth: 80 }}>
        Cuota {index + 1}
      </Typography>
      
      <CuotaInlineEditor
        cuota={cuota}
        onChange={handleCuotaChange}
        editable={editable && !isLoading}
        formData={formData}
        tipo="completo"
      />
      
      {isLoading && (
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          Guardando...
        </Typography>
      )}
    </Box>
  );
};

export default ExampleCuotaInlineEditor; 