import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  LocationOnOutlined as LocationIcon,
  PeopleOutlined as PeopleIcon,
  MeetingRoomOutlined as AmbientesIcon,
  DescriptionOutlined as ContratosIcon,
  FolderOutlined as DocumentosIcon,
} from '@mui/icons-material';
import { useResponsive } from '@shared/hooks';
import { TaskFormHeader } from '../../../foco/src/foco/taskFormUi';
import { getEstadoColor, getEstadoText } from '@shared/components/common/StatusSystem';
import clienteAxios from '@shared/config/axios';
import { toast } from 'react-hot-toast';
import TipoPropiedadIcon from './TipoPropiedadIcon';
import { SeccionInquilinos, SeccionDocumentos, SeccionUbicacion, SeccionContratos } from './SeccionesPropiedad';
import PropiedadHabitacionesSection from './PropiedadHabitacionesSection';
import PropiedadDetailSections from './PropiedadDetailSections';
import ContratoDetail from './contratos/ContratoDetail';
import {
  getPropiedadDetailPaperSx,
  propiedadDetailContentSx,
  propiedadDetailHeaderTitleSx,
  propiedadDetailHeaderMetaSx,
  propiedadDetailHeaderSubtitleSx,
  getPropiedadDetailEstadoPillSx,
  propiedadDetailFooterSx,
  propiedadDetailFooterActionSx,
  propiedadDetailCloseButtonSx,
} from './propiedadDetailStyles';

function PropiedadEstadoPill({ estado }) {
  const color = getEstadoColor(estado, 'PROPIEDAD');
  return (
    <Box component="span" sx={getPropiedadDetailEstadoPillSx(color)}>
      {getEstadoText(estado, 'PROPIEDAD')}
    </Box>
  );
}

const PropiedadDetail = ({
  propiedad,
  open,
  onClose,
  onEdit,
  onDelete,
  propiedades = [],
  initialExpandedSection,
  initialHabitacionId = null,
}) => {
  const { isMobile } = useResponsive();

  const [propiedadCompleta, setPropiedadCompleta] = useState(propiedad);
  const [contratoDetailOpen, setContratoDetailOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState(null);

  useEffect(() => {
    if (open && propiedad?._id) {
      fetchPropiedadCompleta();
    }
    // eslint-disable-next-line
  }, [open, propiedad?._id]);

  const fetchPropiedadCompleta = async () => {
    try {
      const response = await clienteAxios.get(`/api/propiedades/${propiedad._id}`, {
        params: {
          populate: 'inquilinos,contratos,habitaciones,inventarios,cuenta,moneda,documentos',
          _t: Date.now(),
        },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      setPropiedadCompleta(response.data);
    } catch (error) {
      console.error('Error al obtener propiedad completa:', error);
      toast.error('Error al cargar detalles de la propiedad');
    }
  };

  const habitaciones = useMemo(() => propiedadCompleta?.habitaciones || [], [propiedadCompleta]);
  const inquilinos = useMemo(() => propiedadCompleta?.inquilinos || [], [propiedadCompleta]);
  const inventarios = useMemo(() => propiedadCompleta?.inventarios || [], [propiedadCompleta]);
  const documentos = useMemo(() => propiedadCompleta?.documentos || [], [propiedadCompleta]);
  const contratos = useMemo(() => propiedadCompleta?.contratos || [], [propiedadCompleta]);
  const estadoPropiedad = useMemo(() => propiedadCompleta?.estado || 'DISPONIBLE', [propiedadCompleta]);

  const expandHabitaciones = initialExpandedSection === 'habitaciones' || !!initialHabitacionId;

  const getPropiedadDetailSections = () => [
    {
      key: 'ubicacion',
      title: 'Ubicación',
      icon: LocationIcon,
      defaultExpanded: !expandHabitaciones,
      children: <SeccionUbicacion propiedad={propiedadCompleta} variant="detail" />,
    },
    {
      key: 'inquilinos',
      title: 'Inquilinos',
      icon: PeopleIcon,
      defaultExpanded: false,
      children: <SeccionInquilinos propiedad={propiedadCompleta} inquilinos={inquilinos} variant="detail" />,
    },
    {
      key: 'habitaciones',
      title: 'Ambientes',
      icon: AmbientesIcon,
      defaultExpanded: expandHabitaciones,
      children: (
        <PropiedadHabitacionesSection
          propiedadId={propiedadCompleta?._id || propiedadCompleta?.id}
          habitaciones={habitaciones}
          inventarios={inventarios}
          propiedades={propiedades.length ? propiedades : [propiedadCompleta]}
          onChanged={fetchPropiedadCompleta}
          initialHabitacionId={initialHabitacionId}
        />
      ),
    },
    {
      key: 'contratos',
      title: 'Contratos',
      icon: ContratosIcon,
      defaultExpanded: false,
      children: <SeccionContratos contratos={contratos} variant="detail" />,
    },
    {
      key: 'documentos',
      title: 'Documentos',
      icon: DocumentosIcon,
      defaultExpanded: false,
      children: <SeccionDocumentos documentos={documentos} propiedad={propiedadCompleta} variant="detail" />,
    },
  ];

  const handleCloseContratoDetail = () => {
    setContratoDetailOpen(false);
    setSelectedContrato(null);
  };

  const handleEditPropiedad = () => {
    if (onClose) onClose();
    setTimeout(() => {
      if (onEdit) onEdit(propiedadCompleta);
    }, 200);
  };

  const handleDeletePropiedad = () => {
    if (window.confirm('¿Seguro que deseas eliminar esta propiedad?')) {
      if (onDelete) onDelete(propiedadCompleta);
      if (onClose) onClose();
    }
  };

  const tipoCiudad = [propiedadCompleta?.tipo, propiedadCompleta?.ciudad].filter(Boolean).join(' • ');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: getPropiedadDetailPaperSx(isMobile) }}
    >
      <TaskFormHeader onClose={onClose} sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pr: 3 }}>
          <TipoPropiedadIcon
            tipo={propiedadCompleta?.tipo}
            sx={{ fontSize: 28, color: 'text.secondary', mt: 0.25, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={propiedadDetailHeaderTitleSx}>
              {propiedadCompleta?.alias || 'Sin alias'}
            </Typography>
            <Box sx={propiedadDetailHeaderMetaSx}>
              {tipoCiudad ? (
                <Typography component="span" sx={propiedadDetailHeaderSubtitleSx}>
                  {tipoCiudad}
                </Typography>
              ) : null}
              <PropiedadEstadoPill estado={estadoPropiedad} />
            </Box>
          </Box>
        </Box>
      </TaskFormHeader>

      <DialogContent sx={propiedadDetailContentSx}>
        <PropiedadDetailSections
          key={`${propiedadCompleta?._id || 'new'}-${initialExpandedSection || ''}-${initialHabitacionId || ''}`}
          sections={getPropiedadDetailSections()}
        />
      </DialogContent>

      <Box sx={propiedadDetailFooterSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={handleEditPropiedad}
              aria-label="Editar propiedad"
              sx={propiedadDetailFooterActionSx}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={handleDeletePropiedad}
              aria-label="Eliminar propiedad"
              sx={{
                ...propiedadDetailFooterActionSx,
                '&:hover': { bgcolor: 'action.hover', color: 'error.main' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Button onClick={onClose} sx={propiedadDetailCloseButtonSx}>
          Cerrar
        </Button>
      </Box>

      <ContratoDetail
        open={contratoDetailOpen}
        onClose={handleCloseContratoDetail}
        contrato={selectedContrato}
        relatedData={propiedadCompleta}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </Dialog>
  );
};

export default PropiedadDetail;
