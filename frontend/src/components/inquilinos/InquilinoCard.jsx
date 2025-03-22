import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Description as ContractIcon
} from '@mui/icons-material';

const InquilinoCard = ({ 
  inquilino, 
  onEdit, 
  onDelete,
  showActions = true
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const {
    _id,
    nombre,
    apellido,
    email,
    telefono,
    dni,
    estado = 'PENDIENTE',
    contratosClasificados = {}
  } = inquilino;

  const getStatusColor = (status) => {
    const statusColors = {
      'ACTIVO': 'success',
      'RESERVADO': 'warning',
      'INACTIVO': 'error',
      'PENDIENTE': 'info'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'ACTIVO': 'Activo',
      'RESERVADO': 'Reservado',
      'INACTIVO': 'Inactivo',
      'PENDIENTE': 'Pendiente'
    };
    return statusLabels[status] || status;
  };

  const getInitials = () => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
  };

  // Obtener el contrato activo o más reciente
  const getContratoActual = () => {
    if (contratosClasificados.activos?.length > 0) {
      return contratosClasificados.activos[0];
    }
    if (contratosClasificados.futuros?.length > 0) {
      return contratosClasificados.futuros[0];
    }
    if (contratosClasificados.vencidos?.length > 0) {
      return contratosClasificados.vencidos[0];
    }
    return null;
  };

  const contratoActual = getContratoActual();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.default',
        transition: 'all 0.2s ease',
        position: 'relative',
        borderRadius: 0,
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      {/* Estado */}
      <Chip
        label={getStatusLabel(estado)}
        color={getStatusColor(estado)}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          borderRadius: 0,
          height: 20,
          fontSize: '0.65rem'
        }}
      />

      {/* Contenido Principal */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Avatar 
          sx={{ 
            width: 48, 
            height: 48,
            bgcolor: 'primary.main',
            fontSize: '1rem'
          }}
        >
          {getInitials()}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
            {nombre} {apellido}
          </Typography>

          {/* Detalles */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {email}
                </Typography>
              </Box>
            )}
            {telefono && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {telefono}
                </Typography>
              </Box>
            )}
            {dni && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  DNI: {dni}
                </Typography>
              </Box>
            )}
            {contratoActual && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {contratoActual.propiedad.nombre}
                  <span style={{ marginLeft: '8px', fontSize: '0.8em', opacity: 0.8 }}>
                    ({new Date(contratoActual.fechaInicio).toLocaleDateString()} - {new Date(contratoActual.fechaFin).toLocaleDateString()})
                  </span>
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Historial de Contratos */}
      {(contratosClasificados.activos?.length > 0 || 
        contratosClasificados.futuros?.length > 0 || 
        contratosClasificados.vencidos?.length > 0) && (
        <>
          <Box
            onClick={() => setExpanded(!expanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              userSelect: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <ContractIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">
              Historial de Contratos
            </Typography>
            <IconButton
              size="small"
              sx={{
                p: 0.5,
                ml: 'auto',
                transform: expanded ? 'rotate(-180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Collapse in={expanded}>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {contratosClasificados.activos?.map(contrato => (
                <Typography key={contrato._id} variant="body2" color="success.main" sx={{ fontSize: '0.75rem' }}>
                  {contrato.propiedad.nombre} (Activo)
                </Typography>
              ))}
              {contratosClasificados.futuros?.map(contrato => (
                <Typography key={contrato._id} variant="body2" color="warning.main" sx={{ fontSize: '0.75rem' }}>
                  {contrato.propiedad.nombre} (Reservado)
                </Typography>
              ))}
              {contratosClasificados.vencidos?.map(contrato => (
                <Typography key={contrato._id} variant="body2" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                  {contrato.propiedad.nombre} (Vencido)
                </Typography>
              ))}
            </Box>
          </Collapse>
        </>
      )}

      {/* Acciones */}
      {showActions && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: 1,
          mt: 2
        }}>
          <Tooltip title="Editar">
            <IconButton 
              size="small" 
              onClick={() => onEdit(inquilino)}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              size="small" 
              onClick={() => onDelete(inquilino)}
              sx={{ 
                color: 'error.light',
                '&:hover': { color: 'error.main' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Paper>
  );
};

export default InquilinoCard; 