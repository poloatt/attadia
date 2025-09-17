import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  BedOutlined as BedIcon,
  BathtubOutlined as BathIcon,
  KitchenOutlined as KitchenIcon,
  WeekendOutlined as LivingIcon,
  YardOutlined as GardenIcon,
  DeckOutlined as TerraceIcon,
  LocalLaundryServiceOutlined as LaundryIcon,
  HomeWorkOutlined as StudioIcon,
  MeetingRoomOutlined as RoomIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import clienteAxios from '../../config/axios';

const DialogHeader = ({ title, onClose, isLoading }) => (
  <Box sx={{ position: 'relative' }}>
    <DialogTitle sx={{ px: 3, py: 2 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ 
          color: isLoading ? 'text.secondary' : 'text.primary' 
        }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ 
            color: 'text.secondary',
            borderRadius: 0
          }}
          disabled={isLoading}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <Fade in={isLoading}>
      <LinearProgress 
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          height: 2
        }} 
      />
    </Fade>
  </Box>
);

const HabitacionItem = ({ habitacion, onDelete, index }) => {
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'BAÑO':
      case 'TOILETTE':
        return <BathIcon sx={{ fontSize: 16 }} />;
      case 'DORMITORIO_DOBLE':
      case 'DORMITORIO_SIMPLE':
        return <BedIcon sx={{ fontSize: 16 }} />;
      case 'ESTUDIO':
        return <StudioIcon sx={{ fontSize: 16 }} />;
      case 'COCINA':
      case 'DESPENSA':
        return <KitchenIcon sx={{ fontSize: 16 }} />;
      case 'SALA_PRINCIPAL':
        return <LivingIcon sx={{ fontSize: 16 }} />;
      case 'PATIO':
      case 'JARDIN':
        return <GardenIcon sx={{ fontSize: 16 }} />;
      case 'TERRAZA':
        return <TerraceIcon sx={{ fontSize: 16 }} />;
      case 'LAVADERO':
        return <LaundryIcon sx={{ fontSize: 16 }} />;
      default:
        return <RoomIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getTipoLabel = (tipo, nombrePersonalizado) => {
    if (tipo === 'OTRO') {
      return nombrePersonalizado;
    }
    const tipoLabels = {
      'BAÑO': 'Baño',
      'TOILETTE': 'Toilette',
      'DORMITORIO_DOBLE': 'Dormitorio Doble',
      'DORMITORIO_SIMPLE': 'Dormitorio Simple',
      'ESTUDIO': 'Estudio',
      'COCINA': 'Cocina',
      'DESPENSA': 'Despensa',
      'SALA_PRINCIPAL': 'Sala Principal',
      'PATIO': 'Patio',
      'JARDIN': 'Jardín',
      'TERRAZA': 'Terraza',
      'LAVADERO': 'Lavadero'
    };
    return tipoLabels[tipo] || tipo;
  };

  return (
    <ListItem
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        mb: 1,
        borderRadius: 0,
        bgcolor: 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
        {getTipoIcon(habitacion.tipo)}
      </Box>
      <ListItemText
        primary={getTipoLabel(habitacion.tipo, habitacion.nombrePersonalizado)}
        secondary={`Habitación ${index + 1}`}
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={() => onDelete(index)}
          sx={{ borderRadius: 0 }}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const HabitacionesForm = ({ 
  open, 
  onClose, 
  onSubmit,
  propiedades = [],
  initialPropiedadId = null
}) => {
  const [propiedadId, setPropiedadId] = useState(initialPropiedadId || '');
  const [habitaciones, setHabitaciones] = useState([]);
  const [currentHabitacion, setCurrentHabitacion] = useState({
    tipo: '',
    nombrePersonalizado: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setPropiedadId(initialPropiedadId || '');
      setHabitaciones([]);
      setCurrentHabitacion({ tipo: '', nombrePersonalizado: '' });
      setErrors({});
    }
  }, [open, initialPropiedadId]);

  const tipoOptions = [
    { value: 'BAÑO', label: 'Baño' },
    { value: 'TOILETTE', label: 'Toilette' },
    { value: 'DORMITORIO_DOBLE', label: 'Dormitorio Doble' },
    { value: 'DORMITORIO_SIMPLE', label: 'Dormitorio Simple' },
    { value: 'ESTUDIO', label: 'Estudio' },
    { value: 'COCINA', label: 'Cocina' },
    { value: 'DESPENSA', label: 'Despensa' },
    { value: 'SALA_PRINCIPAL', label: 'Sala Principal' },
    { value: 'PATIO', label: 'Patio' },
    { value: 'JARDIN', label: 'Jardín' },
    { value: 'TERRAZA', label: 'Terraza' },
    { value: 'LAVADERO', label: 'Lavadero' },
    { value: 'OTRO', label: 'Otro tipo...' }
  ];

  const handleAddHabitacion = useCallback(() => {
    if (!currentHabitacion.tipo) {
      setErrors(prev => ({ ...prev, tipo: 'Selecciona un tipo de habitación' }));
      return;
    }

    if (currentHabitacion.tipo === 'OTRO' && !currentHabitacion.nombrePersonalizado.trim()) {
      setErrors(prev => ({ ...prev, nombrePersonalizado: 'Debes especificar el tipo de habitación' }));
      return;
    }

    setHabitaciones(prev => [...prev, { ...currentHabitacion }]);
    setCurrentHabitacion({ tipo: '', nombrePersonalizado: '' });
    setErrors({});
  }, [currentHabitacion]);

  const handleDeleteHabitacion = useCallback((index) => {
    setHabitaciones(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!propiedadId) {
      enqueueSnackbar('Debes seleccionar una propiedad', { variant: 'error' });
      return;
    }

    if (habitaciones.length === 0) {
      enqueueSnackbar('Debes agregar al menos una habitación', { variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const habitacionesData = habitaciones.map(habitacion => ({
        propiedadId,
        tipo: habitacion.tipo,
        nombrePersonalizado: habitacion.tipo === 'OTRO' ? habitacion.nombrePersonalizado : undefined
      }));

      await onSubmit(habitacionesData);
      enqueueSnackbar(`${habitaciones.length} habitación(es) agregada(s) exitosamente`, { 
        variant: 'success' 
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar habitaciones:', error);
      enqueueSnackbar('Error al guardar las habitaciones', { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [propiedadId, habitaciones, onSubmit, onClose, enqueueSnackbar]);

  const handleCurrentHabitacionChange = useCallback((field, value) => {
    setCurrentHabitacion(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  return (
    <Dialog
      open={open}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          borderRadius: 0
        }
      }}
    >
      <DialogHeader 
        title="Agregar Múltiples Habitaciones" 
        onClose={onClose}
        isLoading={isSaving}
      />
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Selección de Propiedad */}
          <FormControl fullWidth size="small">
            <InputLabel required>Propiedad</InputLabel>
            <Select
              value={propiedadId}
              onChange={(e) => setPropiedadId(e.target.value)}
              label="Propiedad"
              disabled={isSaving}
            >
              {propiedades.map(propiedad => (
                <MenuItem key={propiedad.id} value={propiedad.id}>
                  {propiedad.titulo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          {/* Formulario para agregar habitación */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Agregar Habitación
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Tipo de Habitación</InputLabel>
                <Select
                  value={currentHabitacion.tipo}
                  onChange={(e) => handleCurrentHabitacionChange('tipo', e.target.value)}
                  label="Tipo de Habitación"
                  error={!!errors.tipo}
                >
                  {tipoOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {currentHabitacion.tipo === 'OTRO' && (
                <TextField
                  label="Especificar tipo"
                  value={currentHabitacion.nombrePersonalizado}
                  onChange={(e) => handleCurrentHabitacionChange('nombrePersonalizado', e.target.value)}
                  placeholder="Ej: Sala de juegos, Gimnasio, etc."
                  size="small"
                  error={!!errors.nombrePersonalizado}
                  helperText={errors.nombrePersonalizado}
                  sx={{ flex: 1 }}
                />
              )}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddHabitacion}
                disabled={isSaving}
                sx={{ borderRadius: 0 }}
              >
                Agregar
              </Button>
            </Box>
          </Box>

          {/* Lista de habitaciones agregadas */}
          {habitaciones.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Habitaciones a agregar ({habitaciones.length})
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  maxHeight: 300, 
                  overflow: 'auto',
                  borderRadius: 0
                }}
              >
                <List dense>
                  {habitaciones.map((habitacion, index) => (
                    <HabitacionItem
                      key={index}
                      habitacion={habitacion}
                      onDelete={handleDeleteHabitacion}
                      index={index}
                    />
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {habitaciones.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 0 }}>
              Agrega habitaciones usando el formulario de arriba
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={isSaving}
          sx={{ borderRadius: 0 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving || habitaciones.length === 0}
          sx={{ borderRadius: 0 }}
        >
          {isSaving ? 'Guardando...' : `Guardar ${habitaciones.length} habitación(es)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HabitacionesForm; 