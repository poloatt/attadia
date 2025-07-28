import React from 'react';
import {
  EntityDetailSection,
  EntityDetailGrid,
  GeometricModalHeader,
  GeometricDialog,
  EstadoChip,
  CollapsibleSection
} from '../../common/CommonDetails';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import DescriptionIcon from '@mui/icons-material/Description';
import { getEstadoColor, getEstadoText } from '../../common/StatusSystem';
import { useNavigate } from 'react-router-dom';
import TipoPropiedadIcon from '../TipoPropiedadIcon';
import CommonActions from '../../common/CommonActions';
import { formatFecha } from '../../../utils/contratoUtils';
import ContratoDetail from '../contratos/ContratoDetail';
import PropiedadDetail from '../PropiedadDetail';
import { Typography, Box } from '@mui/material';
import { Tooltip, IconButton } from '@mui/material';
import OpenIcon from '@mui/icons-material/OpenInNew';
import ViewIcon from '@mui/icons-material/Visibility';
import useResponsive from '../../../hooks/useResponsive';
import { SeccionContratos } from '../SeccionesPropiedad';
import ContratoCard from '../contratos/ContratoCard';
import { CuotasProvider } from '../contratos';

const getStatusColor = (status) => {
  const color = getEstadoColor(status, 'INQUILINO');
  // Convertir color hex a nombre de color de Material-UI
  if (color === '#4caf50') return 'success';
  if (color === '#ff9800') return 'warning';
  if (color === '#9e9e9e') return 'default';
  if (color === '#2196f3') return 'info';
  return 'default';
};

const getStatusLabel = (status) => {
  return getEstadoText(status, 'INQUILINO');
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
        <DescriptionIcon sx={{ fontSize: 18, color: 'primary.light', flexShrink: 0 }} />
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
  const navigate = useNavigate();

  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit(inquilino);
    } else if (inquilino && inquilino._id) {
      navigate('/inquilinos', { state: { editInquilino: true, inquilinoId: inquilino._id } });
    }
    if (onClose) onClose();
  };

  const handleDelete = () => {
    if (typeof onDelete === 'function') {
      onDelete(inquilino._id || inquilino.id);
    }
    if (onClose) onClose();
  };

  // Obtener el contrato actual
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
  const [contratoDetailOpen, setContratoDetailOpen] = React.useState(false);
  const [propiedadDetailOpen, setPropiedadDetailOpen] = React.useState(false);

  return (
    <GeometricDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      actions={
        <CommonActions
          onEdit={handleEdit}
          onDelete={handleDelete}
          itemName={`${nombre} ${apellido}`}
          showEdit={true}
          showDelete={true}
        />
      }
    >
      <GeometricModalHeader
        title={`${nombre} ${apellido}`}
        chip={<EstadoChip estado={estado} tipo="INQUILINO" />}
        onClose={onClose}
      />
      {(() => {
        const { theme } = useResponsive();
        return (
          <Box sx={{ p: 2, pt: 1, backgroundColor: theme.palette.collapseHeader.background }}>
            <EntityDetailGrid spacing={2}>
              <CollapsibleSection title="Datos personales" icon={BadgeIcon} defaultExpanded={true}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">Nombre: {nombre}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">Apellido: {apellido}</Typography>
                </Box>
                {email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">Email: {email}</Typography>
                  </Box>
                )}
                {telefono && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">Teléfono: {telefono}</Typography>
                  </Box>
                )}
                {dni && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">DNI: {dni}</Typography>
                  </Box>
                )}
              </CollapsibleSection>
              {/* Sección de Propiedad principal del contrato actual */}
              {contratoActual && contratoActual.propiedad && contratoActual.fechaInicio && contratoActual.fechaFin && (
                <CollapsibleSection title="Propiedad" icon={TipoPropiedadIcon} defaultExpanded={true}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TipoPropiedadIcon tipo={contratoActual.propiedad?.tipo} sx={{ fontSize: 22, color: 'primary.main' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {contratoActual.propiedad?.alias || contratoActual.propiedad?.nombre || 'Propiedad'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatFecha(contratoActual.fechaInicio)} - {formatFecha(contratoActual.fechaFin)} • {formatContratoDuration(contratoActual.fechaInicio, contratoActual.fechaFin)}
                  </Typography>
                </CollapsibleSection>
              )}
              {/* Sección Contratos: muestra todos los contratos del inquilino si existen */}
              {inquilino?.contratos?.length > 0 && (
                <CollapsibleSection title="Contratos" icon={DescriptionIcon} defaultExpanded={true}>
                  {inquilino.contratos.map((contrato, idx) => (
                    <CuotasProvider key={contrato._id || contrato.id || idx} contratoId={contrato._id || contrato.id} formData={contrato} relatedData={{ inquilino, propiedad: contrato.propiedad }}>
                      <ContratoCard contrato={contrato} />
                    </CuotasProvider>
                  ))}
                </CollapsibleSection>
              )}
              <SeccionContratos inquilino={inquilino} />
              {/* Aquí podrías agregar una sección de documentos si existe en el modelo */}
            </EntityDetailGrid>
          </Box>
        );
      })()}
      {/* Modales de detalle de contrato y propiedad */}
      {contratoActual && (
        <ContratoDetail
          open={contratoDetailOpen}
          onClose={() => setContratoDetailOpen(false)}
          contrato={contratoActual}
          onEdit={() => { setContratoDetailOpen(false); navigate('/contratos', { state: { editContract: true, contratoId: contratoActual._id } }); }}
          onDelete={() => setContratoDetailOpen(false)}
        />
      )}
      {contratoActual && contratoActual.propiedad && (
        <PropiedadDetail
          open={propiedadDetailOpen}
          onClose={() => setPropiedadDetailOpen(false)}
          propiedad={contratoActual.propiedad}
        />
      )}
    </GeometricDialog>
  );
};

export default InquilinoDetail; 
