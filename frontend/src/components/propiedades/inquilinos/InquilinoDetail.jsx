import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  Stack,
  Divider,
  Button
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Description as ContractIcon,
  CalendarToday as CalendarIcon,
  OpenInNew as OpenIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

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

const getInitials = (nombre, apellido) => {
  return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
};

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

const ContratoItem = ({ contrato, onContratoClick }) => {
  // Estado local para popup de inquilino
  const [inquilinoDetailOpen, setInquilinoDetailOpen] = React.useState(false);
  const [selectedInquilino, setSelectedInquilino] = React.useState(null);

  // Si el contrato tiene inquilinos relacionados
  const inquilinos = contrato.inquilinos || [];

  const handleOpenInquilino = (inquilino) => {
    setSelectedInquilino(inquilino);
    setInquilinoDetailOpen(true);
  };
  const handleCloseInquilino = () => {
    setInquilinoDetailOpen(false);
    setSelectedInquilino(null);
  };

  return (
    <>
      <Box
        onClick={() => onContratoClick && onContratoClick(contrato)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          cursor: onContratoClick ? 'pointer' : 'default',
          borderRadius: 0.5,
          px: 1,
          py: 0.7,
          transition: 'background 0.15s',
          '&:hover': {
            backgroundColor: onContratoClick ? 'rgba(120,180,255,0.07)' : undefined,
            color: onContratoClick ? 'primary.main' : undefined
          }
        }}
      >
        <ContractIcon sx={{ fontSize: 18, color: 'primary.light', flexShrink: 0 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', minWidth: 80, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {contrato.propiedad?.titulo || contrato.propiedad?.nombre || 'Propiedad'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', mx: 0.5 }}>
          •
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', minWidth: 120 }}>
          {new Date(contrato.fechaInicio).toLocaleDateString()} - {new Date(contrato.fechaFin).toLocaleDateString()}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', mx: 0.5 }}>
          •
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', minWidth: 50 }}>
          {formatContratoDuration(contrato.fechaInicio, contrato.fechaFin)}
        </Typography>
        {onContratoClick && (
          <OpenIcon sx={{ fontSize: 16, color: 'primary.light', ml: 0.5 }} />
        )}
        {/* Mostrar inquilinos relacionados con ícono de ojo */}
        {inquilinos.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
            {inquilinos.map((inq, idx) => (
              <Box key={inq._id || inq.id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', fontWeight: 400 }}>
                  {inq.nombre} {inq.apellido}
                </Typography>
                <Tooltip title="Ver detalle inquilino">
                  <IconButton size="small" onClick={e => { e.stopPropagation(); handleOpenInquilino(inq); }} sx={{ p: 0.2, color: 'primary.main' }}>
                    <ViewIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      {/* Popup de detalle de inquilino relacionado */}
      {selectedInquilino && (
        <InquilinoDetail
          open={inquilinoDetailOpen}
          onClose={handleCloseInquilino}
          inquilino={selectedInquilino}
        />
      )}
    </>
  );
};

const InquilinoDetail = ({ open, onClose, inquilino, onEdit, onDelete, onContratoClick }) => {
  if (!inquilino) return null;
  const { nombre, apellido, email, telefono, dni, estado = 'PENDIENTE', contratosClasificados = {} } = inquilino;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.2rem' }}>{getInitials(nombre, apellido)}</Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{nombre} {apellido}</Typography>
            <Chip label={getStatusLabel(estado)} color={getStatusColor(estado)} size="small" sx={{ borderRadius: 0, fontWeight: 500, fontSize: '0.8rem', mt: 0.5 }} />
          </Box>
        </Box>
        <Box>
          <Tooltip title="Editar">
            <IconButton onClick={() => onEdit && onEdit(inquilino)} size="small" sx={{ color: 'text.secondary', mr: 1 }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton onClick={() => onDelete && onDelete(inquilino)} size="small" sx={{ color: 'error.main', mr: 1 }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cerrar">
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'background.default', p: 3 }}>
        <Stack spacing={2}>
          {/* Datos personales */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>Datos personales</Typography>
            <Stack spacing={1}>
              {email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{email}</Typography>
                </Box>
              )}
              {telefono && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{telefono}</Typography>
                </Box>
              )}
              {dni && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">DNI: {dni}</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Contratos activos */}
          {contratosClasificados.activos?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>Contratos activos</Typography>
              <Stack spacing={1}>
                {contratosClasificados.activos.map((contrato, index) => (
                  <ContratoItem key={contrato._id || contrato.id || `activo-${index}`} contrato={contrato} onContratoClick={onContratoClick} />
                ))}
              </Stack>
            </Box>
          )}

          {/* Contratos futuros */}
          {contratosClasificados.futuros?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>Contratos futuros</Typography>
              <Stack spacing={1}>
                {contratosClasificados.futuros.map((contrato, index) => (
                  <ContratoItem key={contrato._id || contrato.id || `futuro-${index}`} contrato={contrato} onContratoClick={onContratoClick} />
                ))}
              </Stack>
            </Box>
          )}

          {/* Contratos vencidos */}
          {contratosClasificados.vencidos?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>Contratos vencidos</Typography>
              <Stack spacing={1}>
                {contratosClasificados.vencidos.map((contrato, index) => (
                  <ContratoItem key={contrato._id || contrato.id || `vencido-${index}`} contrato={contrato} onContratoClick={onContratoClick} />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default InquilinoDetail; 
