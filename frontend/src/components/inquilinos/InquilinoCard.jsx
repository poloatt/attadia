import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  OpenInNew as OpenIcon,
  CalendarToday as CalendarIcon,
  Description as ContractIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import InquilinoDetail from './InquilinoDetail';

const InquilinoCard = ({ 
  inquilino, 
  onEdit, 
  onDelete,
  onCreateContract,
  showActions = true
}) => {
  const navigate = useNavigate();
  const [detailOpen, setDetailOpen] = React.useState(false);
  
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
      'INACTIVO': 'default',
      'PENDIENTE': 'info',
      'SIN_CONTRATO': 'info'
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

  // Función para formatear la duración del contrato
  const formatContratoDuration = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) {
      return `${diffYears} año${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    } else {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
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

  // Función para navegar al contrato
  const handleContratoClick = (contrato) => {
    navigate('/contratos', { 
      state: { 
        editContract: true, 
        contratoId: contrato._id 
      } 
    });
  };

  const contratoActual = getContratoActual();

  const handleOpenDetail = () => {
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  return (
    <>
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
          // Línea superior sutil verde para inquilinos activos
          borderTop: estado === 'ACTIVO' ? '3px solid' : '1px solid',
          borderTopColor: estado === 'ACTIVO' ? 'success.main' : 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        {/* Action Items en la esquina superior derecha */}
        {showActions && (
          <Box sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.25
          }}>
            <Tooltip title="Ver detalle">
              <IconButton 
                size="small" 
                onClick={handleOpenDetail}
                sx={{ 
                  color: 'text.secondary',
                  padding: 0.25,
                  '&:hover': { color: 'primary.main' }
                }}
              >
                <ViewIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Editar">
              <IconButton 
                size="small" 
                onClick={() => onEdit(inquilino)}
                sx={{ 
                  color: 'text.secondary',
                  padding: 0.25,
                  '&:hover': { color: 'primary.main' }
                }}
              >
                <EditIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            
            {/* Botón de crear contrato - visible para todos */}
            {onCreateContract && (
              <Tooltip title="Crear contrato para este inquilino">
                <IconButton 
                  size="small" 
                  onClick={() => onCreateContract(inquilino)}
                  sx={{ 
                    color: 'success.main',
                    padding: 0.25,
                    '&:hover': { 
                      backgroundColor: 'success.light',
                      color: 'success.dark'
                    }
                  }}
                >
                  <AddIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Eliminar">
              <IconButton 
                size="small" 
                onClick={() => onDelete(inquilino)}
                sx={{ 
                  color: 'error.light',
                  padding: 0.25,
                  '&:hover': { color: 'error.main' }
                }}
              >
                <DeleteIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Contenido Principal */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pr: showActions ? 6 : 0 }}>
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
              {/* Solo mostrar propiedad y duración si hay contrato actual y fechas válidas */}
              {contratoActual && contratoActual.propiedad && contratoActual.fechaInicio && contratoActual.fechaFin && (
                <>
                  <Box 
                    onClick={() => handleContratoClick(contratoActual)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <ContractIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {contratoActual.propiedad?.titulo || contratoActual.propiedad?.nombre || 'Propiedad'}
                    </Typography>
                    <OpenIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(contratoActual.fechaInicio).toLocaleDateString()} - {new Date(contratoActual.fechaFin).toLocaleDateString()}
                      {' • '}{formatContratoDuration(contratoActual.fechaInicio, contratoActual.fechaFin)}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Popup de detalle */}
      <InquilinoDetail
        open={detailOpen}
        onClose={handleCloseDetail}
        inquilino={inquilino}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

export default InquilinoCard; 