import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, ToggleButtonGroup, ToggleButton, TextField, InputAdornment, Autocomplete, Paper, Button, LinearProgress } from '@mui/material';
import { AddIcon, RemoveIcon, CheckCircleIcon, PendingIcon, CloseIcon, Receipt, Fastfood, HealthAndSafety, Shirt, Cocktail, DirectionsBus, Devices, MoreHoriz } from '../../icons';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

const CATEGORIAS = [
  { valor: 'Contabilidad y Facturas', icon: <Receipt />, color: '#7bba7f' },
  { valor: 'Comida y Mercado', icon: <Fastfood />, color: '#ffb74d' },
  { valor: 'Salud y Belleza', icon: <HealthAndSafety />, color: '#ef5350' },
  { valor: 'Ropa', icon: <Shirt />, color: '#ba68c8' },
  { valor: 'Fiesta', icon: <Cocktail />, color: '#9575cd' },
  { valor: 'Transporte', icon: <DirectionsBus />, color: '#64b5f6' },
  { valor: 'Tecnología', icon: <Devices />, color: '#90a4ae' },
  { valor: 'Otro', icon: <MoreHoriz />, color: '#a1887f' }
];

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      maxHeight: '100%',
      height: '100%',
      width: '100%',
      maxWidth: '100%'
    },
    [theme.breakpoints.up('sm')]: {
      minWidth: '600px',
      maxWidth: '800px'
    }
  }
}));

const TransaccionForm = ({ open, onClose, isSaving, isEditing, formData, handleChange, handleSubmit, handleMontoChange, selectedCuenta, relatedData, isLoadingRelated }) => {
  return (
    <StyledDialog
      open={open}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="md"
      fullWidth
      fullScreen={window.innerWidth < 600}
    >
      <DialogTitle>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.default',
          zIndex: 1
        }}>
          <Typography variant="h6">
            {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
          </Typography>
          <IconButton onClick={onClose} disabled={isSaving}>
            <CloseIcon />
          </IconButton>
        </Box>
        {isSaving && <LinearProgress sx={{ mt: 1 }} />}
      </DialogTitle>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 },
        overflowY: 'auto'
      }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Tipo de Transacción */}
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={formData.tipo}
              exclusive
              onChange={(_, value) => value && handleChange('tipo', value)}
              fullWidth
              sx={{ 
                height: { xs: '56px', sm: '48px' },
                flexDirection: { xs: 'column', sm: 'row' },
                '& .MuiToggleButton-root': {
                  flex: 1
                }
              }}
            >
              <StyledToggleButton value="INGRESO">
                <AddIcon />
                <Typography variant="subtitle2">Ingreso</Typography>
              </StyledToggleButton>
              <StyledToggleButton value="EGRESO">
                <RemoveIcon />
                <Typography variant="subtitle2">Egreso</Typography>
              </StyledToggleButton>
            </ToggleButtonGroup>
            {errors.tipo && (
              <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                {errors.tipo}
              </Typography>
            )}
          </Box>

          {/* Fecha */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha"
              value={formData.fecha || null}
              onChange={(newValue) => handleChange('fecha', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!errors?.fecha}
                  helperText={errors?.fecha}
                  sx={{ mb: 3 }}
                />
              )}
              sx={{ width: '100%', mb: 3 }}
            />
          </LocalizationProvider>

          {/* Monto y Estado */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              fullWidth
              label="Monto"
              value={formData.monto || ''}
              onChange={handleMontoChange}
              error={!!errors.monto}
              helperText={errors.monto}
              InputProps={{
                startAdornment: selectedCuenta && (
                  <InputAdornment position="start">
                    {selectedCuenta.moneda?.simbolo}
                  </InputAdornment>
                )
              }}
            />
            <ToggleButtonGroup
              value={formData.estado}
              exclusive
              onChange={(_, value) => value && handleChange('estado', value)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                '& .MuiToggleButton-root': {
                  flex: { xs: 1, sm: 'initial' }
                }
              }}
            >
              <ToggleButton value="PAGADO" color="success">
                <CheckCircleIcon />
                <Typography variant="caption" sx={{ ml: 1 }}>Pagado</Typography>
              </ToggleButton>
              <ToggleButton value="PENDIENTE" color="warning">
                <PendingIcon />
                <Typography variant="caption" sx={{ ml: 1 }}>Pendiente</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Descripción */}
          <TextField
            fullWidth
            label="Descripción"
            value={formData.descripcion || ''}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            error={!!errors.descripcion}
            helperText={errors.descripcion}
            sx={{ mb: 3 }}
          />

          {/* Cuenta */}
          <Autocomplete
            value={selectedCuenta}
            onChange={(_, newValue) => {
              console.log('Nueva cuenta seleccionada:', newValue);
              handleChange('cuenta', newValue?.id || newValue?._id);
            }}
            options={relatedData?.cuenta || []}
            getOptionLabel={(option) => `${option?.nombre || ''} - ${option?.tipo || ''}`}
            loading={isLoadingRelated}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cuenta"
                error={!!errors.cuenta}
                helperText={errors.cuenta}
                sx={{ mb: 3 }}
              />
            )}
            isOptionEqualToValue={(option, value) => 
              (option?.id === value?.id) || 
              (option?._id === value?._id) ||
              (option?.id === value?._id) ||
              (option?._id === value?.id)
            }
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography>{option.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.moneda?.simbolo} - {option.tipo}
                  </Typography>
                </Box>
              </li>
            )}
          />

          {/* Categorías */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                Categoría
              </Typography>
              {formData.categoria && (
                <Typography variant="body2" color="text.secondary">
                  - {formData.categoria}
                </Typography>
              )}
            </Box>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper',
                border: t => `1px solid ${t.palette.divider}`
              }}
            >
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(4, 1fr)',
                  sm: 'repeat(8, 1fr)'
                },
                gap: 1.5,
                justifyContent: 'center'
              }}>
                {CATEGORIAS.map((categoria) => (
                  <CategoryChip
                    key={categoria.valor}
                    icon={categoria.icon}
                    onClick={() => handleChange('categoria', categoria.valor)}
                    color={formData.categoria === categoria.valor ? 'primary' : 'default'}
                    variant={formData.categoria === categoria.valor ? 'filled' : 'outlined'}
                    sx={{ 
                      width: '100%',
                      height: { xs: '56px', sm: '48px' },
                      '&.MuiChip-filled': {
                        backgroundColor: categoria.color,
                        color: '#fff'
                      },
                      '&:hover': {
                        backgroundColor: `${categoria.color}22`,
                        '& .MuiSvgIcon-root': {
                          color: categoria.color
                        }
                      },
                      '& .MuiSvgIcon-root': {
                        transition: 'color 0.2s ease'
                      }
                    }}
                  />
                ))}
              </Box>
            </Paper>
            {errors.categoria && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                {errors.categoria}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        position: 'sticky',
        bottom: 0,
        bgcolor: 'background.default',
        borderTop: t => `1px solid ${t.palette.divider}`
      }}>
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
          disabled={isSaving}
          sx={{ borderRadius: 0 }}
        >
          {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default TransaccionForm; 