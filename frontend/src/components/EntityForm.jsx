import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
  Chip,
  Box,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EntityForm({ open, onClose, onSubmit, title, fields }) {
  const [formData, setFormData] = useState({
    direccion: '',
    barrio: '',
    provincia: '',
    pais: ''
  });
  const [arrayFields, setArrayFields] = useState({}); // Para campos tipo array
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setFormData({
      direccion: '',
      barrio: '',
      provincia: '',
      pais: ''
    });
    setArrayFields({});
    setIsSubmitting(false);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejo especial para campos tipo array
  const handleArrayAdd = (field) => {
    const newValue = formData[`new${field}`] || '';
    if (newValue.trim()) {
      setArrayFields(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), newValue.trim()]
      }));
      setFormData(prev => ({ ...prev, [`new${field}`]: '' }));
    }
  };

  const handleArrayRemove = (field, index) => {
    setArrayFields(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit(formData);
      onClose(); // Cerrar el formulario después de guardar
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'array':
        return (
          <Box key={field.name}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label={`Nuevo ${field.label}`}
                value={formData[`new${field.name}`] || ''}
                onChange={(e) => handleChange(`new${field.name}`, e.target.value)}
                size="small"
              />
              <IconButton 
                onClick={() => handleArrayAdd(field.name)}
                size="small"
              >
                <AddIcon />
              </IconButton>
            </Stack>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(arrayFields[field.name] || []).map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onDelete={() => handleArrayRemove(field.name, index)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        );
      
      case 'select':
        return (
          <TextField
            select
            key={field.name}
            label={field.label}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            fullWidth
            size="small"
          >
            {field.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );
      
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={formData[field.name] || false}
                onChange={(e) => handleChange(field.name, e.target.checked)}
              />
            }
            label={field.label}
          />
        );
      
      default:
        return (
          <TextField
            key={field.name}
            label={field.label}
            type={field.type}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            fullWidth
            size="small"
          />
        );
    }
  };

  return (
    <Dialog 
      open={open || false}
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={isSubmitting}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        {title}
        <IconButton 
          onClick={handleCancel}
          disabled={isSubmitting}
          size="small"
          sx={{ ml: 2 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {fields.map(field => renderField(field))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={handleCancel}
            disabled={isSubmitting}
            startIcon={<CloseIcon />}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isSubmitting}
            startIcon={<SaveIcon />}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 