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
import CommonHeader from '../../common/CommonHeader';
import EstadoIcon from '../../common/EstadoIcon';
import CommonActions from '../../common/CommonActions';
import TipoPropiedadIcon from '../TipoPropiedadIcon';
import { formatFecha } from '../contratos/contratoUtils';
import PropiedadDetail from '../PropiedadDetail';

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
  const [propiedadDetailOpen, setPropiedadDetailOpen] = React.useState(false);
  
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
        {/* Acciones en el margen superior derecho */}
        {showActions && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
            <CommonActions
              onEdit={() => onEdit(inquilino)}
              onDelete={() => onDelete(inquilino)}
              itemName={`${nombre} ${apellido}`}
            />
          </Box>
        )}
        {/* Contenido Principal */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pr: showActions ? 8 : 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CommonHeader
              icon={EstadoIcon}
              iconProps={{ estado: estadoActual, tipo: 'INQUILINO', sx: { fontSize: 22, mr: 1 } }}
              title={`${nombre} ${apellido}`}
              subtitle={dni || ''}
              titleSize="subtitle1"
              titleWeight={600}
              gap={1}
            />
          </Box>
        </Box>
        {/* Información de contacto y datos adicionales */}
        {(telefono || email) && (
          <>
            <Divider sx={{ my: 1, opacity: 0.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
              {telefono && (
                <InfoRow>
                  <PhoneIcon sx={{ ml: 1 }} />
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
              {email && (
                <InfoRow>
                  <EmailIcon sx={{ ml: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email}
                  </Typography>
                </InfoRow>
              )}
            </Box>
          </>
        )}

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
              <TipoPropiedadIcon tipo={contratoActual.propiedad?.tipo} sx={{ fontSize: 24, color: 'primary.main', mt: 0.2 }} />
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
                    {contratoActual.propiedad?.alias || contratoActual.propiedad?.nombre || 'Propiedad'}
                  </Typography>
                 {/* Botones de ver contrato y ver propiedad a la derecha */}
                 <CommonActions
                   onContratoDetail={contratoActual ? () => setContratoDetailOpen(true) : undefined}
                   onPropiedadDetail={contratoActual && contratoActual.propiedad ? () => setPropiedadDetailOpen(true) : undefined}
                   size="small"
                   direction="row"
                   tipoPropiedad={contratoActual?.propiedad?.tipo}
                 />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.1, lineHeight: 1.2 }}>
                  {formatFecha(contratoActual.fechaInicio)} - {formatFecha(contratoActual.fechaFin)} • {formatContratoDuration(contratoActual.fechaInicio, contratoActual.fechaFin)}
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
      {/* Modal de detalle de propiedad */}
      {contratoActual && contratoActual.propiedad && (
        <PropiedadDetail
          open={propiedadDetailOpen}
          onClose={() => setPropiedadDetailOpen(false)}
          propiedad={contratoActual.propiedad}
        />
      )}
    </>
  );
};

export default InquilinoCard; 
