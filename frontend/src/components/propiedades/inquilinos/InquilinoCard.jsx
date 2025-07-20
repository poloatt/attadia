import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
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
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  PendingActions as PendingIcon,
  BookmarkAdded as ReservedIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import InquilinoDetail from './InquilinoDetail';
import { ContratoDetail } from '../contratos';
import { getEstadoColor, getEstadoText, getEstadoIcon, getStatusIconComponent } from '../../common/StatusSystem';

// Componentes estilizados siguiendo la estética geométrica
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  border: '1px solid',
  borderColor: theme.palette.divider,
  backgroundColor: '#181818',
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  borderRadius: '50%',
  width: 48,
  height: 48,
  backgroundColor: theme.palette.primary.main,
  fontSize: '1rem',
  fontWeight: 600
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main
  }
}));



const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 0),
  '& .MuiSvgIcon-root': {
    fontSize: 16,
    color: theme.palette.text.secondary,
    flexShrink: 0
  }
}));

const ActionBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  display: 'flex',
  gap: 2,
  backgroundColor: '#181818',
  border: '1px solid',
  borderColor: theme.palette.divider,
  padding: theme.spacing(0.25),
  borderRadius: 0
}));

const InquilinoCard = ({ 
  inquilino, 
  onEdit, 
  onDelete,
  onCreateContract,
  showActions = true
}) => {
  const navigate = useNavigate();
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [contratoDetailOpen, setContratoDetailOpen] = React.useState(false);
  
  const {
    _id,
    nombre,
    apellido,
    email,
    telefono,
    dni,
    estadoActual = 'PENDIENTE',
    contratosClasificados = {}
  } = inquilino;

  const getStatusIcon = (status) => {
    const statusIcons = {
      'ACTIVO': CheckIcon,
      'RESERVADO': ReservedIcon,
      'PENDIENTE': PendingIcon,
      'INACTIVO': PersonIcon
    };
    return statusIcons[status] || PersonIcon;
  };

  const getStatusColor = (status) => {
    return getEstadoColor(status, 'INQUILINO');
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
      <StyledPaper
        elevation={0}
        sx={{
          p: 2,
          height: '100%',
          // Línea superior sutil para inquilinos activos
          borderTop: estadoActual === 'ACTIVO' ? '3px solid' : '1px solid',
          borderTopColor: estadoActual === 'ACTIVO' ? getStatusColor(estadoActual) : 'divider',
        }}
      >
        {/* Barra de acciones */}
        {showActions && (
          <ActionBar>
            <Tooltip title="Ver detalle">
              <StyledIconButton size="small" onClick={handleOpenDetail}>
                <ViewIcon sx={{ fontSize: '1rem' }} />
              </StyledIconButton>
            </Tooltip>
            
            <Tooltip title="Editar">
              <StyledIconButton size="small" onClick={() => onEdit(inquilino)}>
                <EditIcon sx={{ fontSize: '1rem' }} />
              </StyledIconButton>
            </Tooltip>
            
            {/* Botón de crear contrato */}
            {onCreateContract && (
              <Tooltip title="Crear contrato">
                <StyledIconButton 
                  size="small" 
                  onClick={() => onCreateContract(inquilino)}
                >
                  <AddIcon sx={{ fontSize: '1rem' }} />
                </StyledIconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Eliminar">
              <StyledIconButton 
                size="small" 
                onClick={() => onDelete(inquilino)}
              >
                <DeleteIcon sx={{ fontSize: '1rem' }} />
              </StyledIconButton>
            </Tooltip>
          </ActionBar>
        )}

        {/* Contenido Principal */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pr: showActions ? 8 : 0 }}>
          <StyledAvatar>
            {getInitials()}
          </StyledAvatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Nombre */}
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {nombre} {apellido}
            </Typography>
            {/* Chip de estado debajo del nombre */}
            <Tooltip title={inquilino.estadoDescripcion || ''} disableHoverListener={!inquilino.estadoDescripcion} arrow>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 4px',
                  fontSize: '0.75rem',
                  color: getEstadoColor(estadoActual, 'INQUILINO'),
                  height: '20px',
                  marginTop: 0.5,
                  marginBottom: 0.5
                }}
              >
                {getStatusIconComponent(estadoActual, 'INQUILINO')}
                {inquilino.estadoLabel || getEstadoText(estadoActual, 'INQUILINO')}
              </Box>
            </Tooltip>
            {/* Información de contacto */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {email && (
                <InfoRow>
                  <EmailIcon />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {email}
                  </Typography>
                </InfoRow>
              )}
              {telefono && (
                <InfoRow>
                  <PhoneIcon />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {telefono}
                  </Typography>
                </InfoRow>
              )}
              {dni && (
                <InfoRow>
                  <BadgeIcon />
                  <Typography variant="body2" color="text.secondary">
                    DNI: {dni}
                  </Typography>
                </InfoRow>
              )}
            </Box>
          </Box>
        </Box>

        {/* Información del contrato */}
        {contratoActual && contratoActual.propiedad && contratoActual.fechaInicio && contratoActual.fechaFin && (
          <>
            <Divider sx={{ my: 1, opacity: 0.5 }} />
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              px: 0,
              py: 0,
              width: '100%',
              margin: 0
            }}>
              <ContractIcon sx={{ fontSize: 24, color: 'primary.main', mt: 0.2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'text.primary',
                      flex: 1
                    }}
                    component="span"
                  >
                    {contratoActual.propiedad?.titulo || contratoActual.propiedad?.nombre || 'Propiedad'}
                  </Typography>
                  <Tooltip title="Ver detalle del contrato">
                    <StyledIconButton size="small" onClick={() => setContratoDetailOpen(true)}>
                      <ViewIcon sx={{ fontSize: 18 }} />
                    </StyledIconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.1, lineHeight: 1.2 }}>
                  {new Date(contratoActual.fechaInicio).toLocaleDateString()} - {new Date(contratoActual.fechaFin).toLocaleDateString()} • {formatContratoDuration(contratoActual.fechaInicio, contratoActual.fechaFin)}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </StyledPaper>

      {/* Popup de detalle */}
      <InquilinoDetail
        open={detailOpen}
        onClose={handleCloseDetail}
        inquilino={inquilino}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {/* Modal de detalle de contrato */}
      {contratoActual && (
        <ContratoDetail
          open={contratoDetailOpen}
          onClose={() => setContratoDetailOpen(false)}
          contrato={contratoActual}
          onEdit={() => { setContratoDetailOpen(false); navigate('/contratos', { state: { editContract: true, contratoId: contratoActual._id } }); }}
          onDelete={() => setContratoDetailOpen(false)}
        />
      )}
    </>
  );
};

export default InquilinoCard; 
