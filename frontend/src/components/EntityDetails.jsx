import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  useTheme
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

export default function EntityDetails({ 
  entity, 
  onEdit, 
  onDelete
}) {
  const theme = useTheme();

  // Si no hay entity, no renderizamos nada
  if (!entity) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: theme.shadows[1],
        '&:hover': {
          boxShadow: theme.shadows[4]
        },
        transition: 'box-shadow 0.3s ease-in-out'
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={entity.imagen || 'https://via.placeholder.com/300x200'}
        alt={entity.titulo || 'Propiedad'}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="h2">
          {entity.titulo}
        </Typography>
        
        <Typography variant="h6" color="primary" gutterBottom>
          {formatCurrency(entity.precio || 0)}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOnIcon sx={{ mr: 1 }} color="action" />
          <Typography variant="body2" color="text.secondary">
            {entity.direccion}, {entity.ciudad}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BedIcon sx={{ mr: 0.5 }} color="action" />
            <Typography variant="body2">{entity.numHabitaciones || 0}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BathtubIcon sx={{ mr: 0.5 }} color="action" />
            <Typography variant="body2">{entity.banos || 0}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SquareFootIcon sx={{ mr: 0.5 }} color="action" />
            <Typography variant="body2">{entity.metrosCuadrados || 0} m²</Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {entity.descripcion || 'Sin descripción'}
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton 
          size="small" 
          onClick={() => onEdit(entity.id)}
          sx={{ color: theme.palette.primary.main }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => onDelete(entity.id)}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
} 