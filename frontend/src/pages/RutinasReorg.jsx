import React, { useState } from 'react';
import { Container, Dialog } from '@mui/material';
import { Toolbar } from '../navigation';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  MonitorWeightOutlined as WeightIcon,
  HealthAndSafety as HealthIcon,
  CalendarMonth as DateIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Button } from '@mui/material';
import { CommonDetails } from '../components/common';
import { RutinasProvider } from '../context/RutinasContext';
import { RutinaTable } from '../components/rutinas/RutinaTable';
import { RutinaForm } from '../components/rutinas';
import { MemoizedRutinaNavigation as RutinaNavigation } from '../components/rutinas/RutinaNavigation';
// RutinaActionsBar no existe, eliminar el import y el uso
import { useRutinas } from '../context/RutinasContext';

/**
 * Contenido principal de la página de Rutinas
 * Se separa para usar el contexto de rutinas
 */
const RutinasContent = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRutina, setEditingRutina] = useState(null);
  const { 
    rutina, 
    error, 
    setError, 
    saveRutina, 
    updateRutinaLocal,
    currentPage,
    totalPages
  } = useRutinas();

  const handleOpenDialog = (rutina = null) => {
    // Limpiar cualquier error previo
    setError(null);
    // Establecer la rutina que se está editando
    setEditingRutina(rutina);
    // Abrir el diálogo
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    // Cerrar el diálogo
    setOpenDialog(false);
    // Limpiar estados
    setEditingRutina(null);
    setError(null);
  };

  const handleSubmit = async (formData) => {
    try {
      const result = await saveRutina(formData);
      if (result.success) {
        // Cerrar el diálogo si la operación fue exitosa
        setOpenDialog(false);
      }
      return result;
    } catch (error) {
      return { success: false, error };
    }
  };

  const handleCheckChange = (updatedRutina) => {
    updateRutinaLocal(updatedRutina);
  };

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <Toolbar />
      
      <CommonDetails 
        title="Rutinas"
        icon={<DateIcon sx={{ fontSize: 20 }} />}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '1.25rem' }} />}
            size="small"
            onClick={() => handleOpenDialog()}
            sx={{ 
              borderRadius: 0,
              fontSize: '0.75rem',
              height: 24,
              textTransform: 'none',
              px: 1,
              py: 0
            }}
          >
            Nueva Rutina
          </Button>
        }
      >
        {/* Componente de navegación */}
        <RutinaNavigation 
          onAdd={() => handleOpenDialog()} 
          onEdit={() => handleOpenDialog(rutina)}
          rutina={rutina}
          loading={false}
          currentPage={currentPage}
          totalPages={totalPages}
        />
        
        {/* Tabla de rutinas */}
        <RutinaTable
          rutina={rutina ? {
            ...rutina,
            _page: currentPage,
            _totalPages: totalPages
          } : null}
          onEdit={() => handleOpenDialog(rutina)}
          onCheckChange={handleCheckChange}
        />
        
        {/* Componente de acciones */}
      </CommonDetails>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        aria-labelledby="rutina-dialog-title"
        aria-describedby="rutina-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 0,
            maxHeight: '90vh'
          }
        }}
      >
        <RutinaForm
          rutina={editingRutina}
          onSubmit={handleSubmit}
          onCancel={handleCloseDialog}
        />
      </Dialog>
    </Box>
  );
};

/**
 * Página principal de Rutinas
 * Envuelve el contenido con el provider del contexto
 */
const RutinasReorg = () => {
  return (
    <RutinasProvider>
      <RutinasContent />
    </RutinasProvider>
  );
};

export default RutinasReorg; 