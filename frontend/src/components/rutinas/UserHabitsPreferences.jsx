import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import { useSnackbar } from 'notistack';
import { useRutinas } from './context/RutinasContext';
import { iconConfig } from './utils/iconConfig';
import ItemCadenciaConfig from './ItemCadenciaConfig';
import { generarMensajeCadencia } from './utils/cadenciaUtils';

/**
 * Componente para gestionar las preferencias de hábitos del usuario
 */
const UserHabitsPreferences = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();
  const { 
    fetchUserHabitPreferences, 
    updateUserHabitPreference,
    applyUserPreferencesToRutina,
    rutina
  } = useRutinas();
  
  // Lista de secciones disponibles
  const sections = [
    { id: 'bodyCare', label: 'Cuidado Personal' },
    { id: 'nutrition', label: 'Nutrición' },
    { id: 'exercise', label: 'Ejercicio' },
    { id: 'mental', label: 'Salud Mental' },
    { id: 'learning', label: 'Aprendizaje' }
  ];
  
  // Cargar preferencias al abrir el diálogo
  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);
  
  // Función para cargar las preferencias
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await fetchUserHabitPreferences();
      
      if (data && data.habits) {
        setPreferences(data.habits);
      } else {
        setPreferences({});
        enqueueSnackbar('No se encontraron preferencias configuradas', { variant: 'info' });
      }
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
      enqueueSnackbar('Error al cargar las preferencias', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setSelectedItem(null); // Cerrar cualquier editor abierto
  };
  
  // Manejar selección de ítem para editar
  const handleSelectItem = (sectionId, itemId) => {
    if (selectedItem && selectedItem.section === sectionId && selectedItem.item === itemId) {
      setSelectedItem(null); // Cerrar si ya está seleccionado
    } else {
      setSelectedItem({ section: sectionId, item: itemId });
    }
  };
  
  // Guardar cambios en preferencias
  const handleSavePreference = async (sectionId, itemId, config) => {
    try {
      setLoading(true);
      
      // Asegurarse de que la configuración tiene el campo esPreferenciaUsuario
      const configWithFlag = {
        ...config,
        esPreferenciaUsuario: true,
        ultimaActualizacion: new Date().toISOString()
      };
      
      // Llamar al servicio para actualizar
      await updateUserHabitPreference(sectionId, itemId, configWithFlag);
      
      // Actualizar el estado local
      setPreferences(prev => {
        const updated = {...prev};
        if (!updated[sectionId]) updated[sectionId] = {};
        updated[sectionId][itemId] = configWithFlag;
        return updated;
      });
      
      // Cerrar el editor
      setSelectedItem(null);
      
      enqueueSnackbar('Preferencia guardada correctamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al guardar preferencia:', error);
      enqueueSnackbar('Error al guardar la preferencia', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Aplicar preferencias a la rutina actual
  const handleApplyToCurrentRutina = async () => {
    if (!rutina || !rutina._id) {
      enqueueSnackbar('No hay rutina seleccionada', { variant: 'warning' });
      return;
    }
    
    try {
      setLoading(true);
      await applyUserPreferencesToRutina(rutina._id);
      onClose(); // Cerrar el diálogo después de aplicar
    } catch (error) {
      console.error('Error al aplicar preferencias:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener el contenido según la pestaña seleccionada
  const getCurrentSection = () => {
    if (!sections[selectedTab]) return null;
    
    const sectionId = sections[selectedTab].id;
    const sectionLabel = sections[selectedTab].label;
    
    // Si no hay preferencias cargadas aún
    if (!preferences) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Cargando preferencias...
          </Typography>
        </Box>
      );
    }
    
    // Si no hay ítems configurados en esta sección
    const sectionItems = Object.keys(iconConfig[sectionId] || {});
    if (sectionItems.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay hábitos disponibles en esta sección
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ width: '100%' }}>
        <List dense>
          {sectionItems.map(itemId => {
            const Icon = iconConfig[sectionId][itemId];
            const itemPreference = preferences[sectionId]?.[itemId];
            const isActive = itemPreference?.activo !== false;
            const isSelected = selectedItem && 
                             selectedItem.section === sectionId && 
                             selectedItem.item === itemId;
            
            return (
              <Box key={itemId}>
                <ListItem
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => handleSelectItem(sectionId, itemId)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{ 
                    bgcolor: isSelected ? 'rgba(0,0,0,0.04)' : 'transparent',
                    opacity: isActive ? 1 : 0.6
                  }}
                >
                  <ListItemIcon>
                    {Icon && <Icon fontSize="small" color={isActive ? "primary" : "disabled"} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={itemId.charAt(0).toUpperCase() + itemId.slice(1)}
                    secondary={
                      itemPreference ? 
                        generarMensajeCadencia(itemPreference) :
                        'No configurado'
                    }
                  />
                  {itemPreference && (
                    <Chip 
                      size="small" 
                      label={itemPreference.tipo || 'DIARIO'} 
                      color={isActive ? "primary" : "default"}
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                </ListItem>
                
                {isSelected && (
                  <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <ItemCadenciaConfig
                      config={itemPreference || {}}
                      onConfigChange={(newConfig) => handleSavePreference(sectionId, itemId, newConfig)}
                      itemId={itemId}
                      onClose={() => setSelectedItem(null)}
                    />
                  </Box>
                )}
                <Divider variant="inset" component="li" />
              </Box>
            );
          })}
        </List>
      </Box>
    );
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        Preferencias de Hábitos
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          Configura tus preferencias de hábitos. Estos ajustes se aplicarán automáticamente a tus nuevas rutinas.
        </Alert>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {sections.map((section, index) => (
              <Tab key={section.id} label={section.label} id={`preference-tab-${index}`} />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          {!loading && getCurrentSection()}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          startIcon={<SyncIcon />}
          onClick={handleApplyToCurrentRutina}
          disabled={loading || !rutina || !rutina._id || rutina._id === 'new'}
        >
          Aplicar a rutina actual
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserHabitsPreferences; 
