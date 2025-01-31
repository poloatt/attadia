import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Grid,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  EditOutlined as EditIcon, 
  DeleteOutlined as DeleteIcon,
  LocationOnOutlined as LocationIcon,
  HomeOutlined as HomeIcon,
  BedOutlined as BedIcon,
  BathtubOutlined as BathtubIcon,
  SquareFootOutlined as SquareFootIcon,
  CalendarTodayOutlined as CalendarIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const EntityCard = ({ property, onEdit, onDelete }) => {
  const theme = useTheme();

  // Definimos las imágenes por defecto según el tipo de propiedad
  const defaultImages = {
    CASA: '/images/house-placeholder.jpg',
    DEPARTAMENTO: '/images/apartment-placeholder.jpg',
    TERRENO: '/images/land-placeholder.jpg',
    LOCAL: '/images/commercial-placeholder.jpg',
    OFICINA: '/images/office-placeholder.jpg',
    default: 'https://placehold.co/600x400/darkgray/white?text=Propiedad'
  };

  // Función para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Función para formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para manejar errores de carga de imagen
  const handleImageError = (e) => {
    e.target.src = defaultImages.default;
  };

  // Obtener el color del chip según el tipo de propiedad
  const getTypeColor = (type) => {
    const colors = {
      CASA: '#424242',         // Gris oscuro
      DEPARTAMENTO: '#616161', // Gris medio oscuro
      TERRENO: '#757575',      // Gris medio
      LOCAL: '#9E9E9E',        // Gris claro
      OFICINA: '#BDBDBD'       // Gris muy claro
    };
    return colors[type] || '#757575'; // Gris por defecto
  };

  const getChipStyles = (type) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    letterSpacing: '0.02em',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.87)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(8px)',
    '& .MuiChip-label': {
      padding: '0 8px'
    }
  });

  // Actualizar los estilos de los iconos en el componente
  const iconStyles = {
    fontSize: '1.125rem',
    color: 'rgba(255, 255, 255, 0.6)',
    opacity: 0.8
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        },
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'rgba(18, 18, 18, 0.9)'
      }}
    >
      {/* Chip de tipo de propiedad */}
      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
        <Chip
          label={property.tipo}
          size="small"
          sx={getChipStyles(property.tipo)}
        />
      </Box>

      {/* Imagen de la propiedad */}
      <CardMedia
        component="img"
        height="200"
        image={property.imagen || defaultImages[property.tipo] || defaultImages.default}
        onError={handleImageError}
        alt={property.titulo}
        sx={{
          objectFit: 'cover',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        {/* Título y precio */}
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom 
          noWrap
          sx={{ 
            fontSize: '1.1rem',
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: 'rgba(255, 255, 255, 0.87)'
          }}
        >
          {property.titulo}
        </Typography>
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.87)',
            fontWeight: 600,
            mb: 2
          }}
        >
          {formatCurrency(property.precio)}
        </Typography>

        <Divider sx={{ 
          my: 1.5, 
          opacity: 0.12,
          borderColor: 'rgba(255, 255, 255, 0.12)' 
        }} />

        {/* Ubicación */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationIcon sx={{ ...iconStyles, mr: 1 }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {property.direccion}, {property.ciudad}, {property.estado}
          </Typography>
        </Box>

        {/* Características principales */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Tooltip title="Habitaciones" arrow placement="top">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5
              }}>
                <BedIcon sx={iconStyles} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {property.numHabitaciones}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={4}>
            <Tooltip title="Baños" arrow placement="top">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5
              }}>
                <BathtubIcon sx={iconStyles} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {property.banos}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={4}>
            <Tooltip title="Metros cuadrados" arrow placement="top">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5
              }}>
                <SquareFootIcon sx={iconStyles} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {property.metrosCuadrados}m²
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Descripción con gradiente */}
        <Typography 
          variant="body2" 
          sx={{
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1,
            lineHeight: 1.5,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '25%',
              height: '100%',
              background: 'linear-gradient(to right, transparent, background.paper)'
            }
          }}
        >
          {property.descripcion}
        </Typography>

        {/* Fecha de actualización */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            Actualizado: {formatDate(property.updatedAt)}
          </Typography>
        </Box>
      </CardContent>

      {/* Acciones */}
      <CardActions sx={{ justifyContent: 'flex-end', p: 1.5, gap: 0.5 }}>
        <Tooltip title="Editar">
          <IconButton 
            size="small" 
            onClick={() => onEdit(property.id)}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.87)'
              }
            }}
          >
            <EditIcon sx={iconStyles} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton 
            size="small" 
            onClick={() => onDelete(property.id)}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { 
                backgroundColor: 'rgba(255, 0, 0, 0.08)',
                color: 'rgba(255, 82, 82, 0.87)'
              }
            }}
          >
            <DeleteIcon sx={iconStyles} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default EntityCard;

const placeholderUrl = 'https://picsum.photos/300/200';   // Servicio alternativo 

// Alternativa usando un servicio más confiable
const getPlaceholderImage = (width = 300, height = 200) => {
  return `https://picsum.photos/${width}/${height}`;
  // o
  // return `https://source.unsplash.com/random/${width}x${height}/?house`;
};  