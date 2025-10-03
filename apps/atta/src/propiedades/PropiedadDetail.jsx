import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, DialogContent } from '@mui/material';
import { useResponsive } from '@shared/hooks';
import { GeometricDialog, GeometricModalHeader, EstadoChip, EntityDetailSection, EntityDetailGrid, CollapsibleSection, EntityDetailSections } from '@shared/components/common/CommonDetails';
import clienteAxios from '@shared/config/axios';
import { toast } from 'react-hot-toast';
import TipoPropiedadIcon from './TipoPropiedadIcon';
import { SeccionInquilinos, SeccionHabitaciones, SeccionDocumentos, SeccionUbicacion, SeccionContratos } from './SeccionesPropiedad';
import CommonActions from '@shared/components/common/CommonActions';
import ContratoDetail from './contratos/ContratoDetail';

const PropiedadDetail = ({ propiedad, open, onClose, onEdit, onDelete }) => {
  const { isMobile, theme } = useResponsive();

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
          _t: Date.now()
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      setPropiedadCompleta(response.data);
    } catch (error) {
      console.error('Error al obtener propiedad completa:', error);
      toast.error('Error al cargar detalles de la propiedad');
    }
  };

  // Memoizar datos para evitar re-renderizados innecesarios
  const habitaciones = useMemo(() => propiedadCompleta?.habitaciones || [], [propiedadCompleta]);
  const inquilinos = useMemo(() => propiedadCompleta?.inquilinos || [], [propiedadCompleta]);
  const inventarios = useMemo(() => propiedadCompleta?.inventarios || [], [propiedadCompleta]);
  const documentos = useMemo(() => propiedadCompleta?.documentos || [], [propiedadCompleta]);
  const contratos = useMemo(() => propiedadCompleta?.contratos || [], [propiedadCompleta]);
  const estadoPropiedad = useMemo(() => propiedadCompleta?.estado || 'DISPONIBLE', [propiedadCompleta]);

  // Definición modular de secciones
  const getPropiedadDetailSections = () => ([
    {
      key: 'ubicacion',
      title: 'Ubicación',
      icon: TipoPropiedadIcon,
      defaultExpanded: true,
      children: <SeccionUbicacion propiedad={propiedadCompleta} />
    },
    {
      key: 'inquilinos',
      title: 'Inquilinos',
      icon: undefined,
      defaultExpanded: false,
      children: <SeccionInquilinos propiedad={propiedadCompleta} inquilinos={inquilinos} />
    },
    {
      key: 'habitaciones',
      title: 'Habitaciones',
      icon: undefined,
      defaultExpanded: false,
      children: <SeccionHabitaciones habitaciones={habitaciones} inventarios={inventarios} />
    },
    {
      key: 'contratos',
      title: 'Contratos',
      icon: undefined,
      defaultExpanded: false,
      children: <SeccionContratos contratos={contratos} />
    },
    {
      key: 'documentos',
      title: 'Documentos',
      icon: undefined,
      defaultExpanded: false,
      children: <SeccionDocumentos documentos={documentos} propiedad={propiedadCompleta} />
    }
  ]);

  // Handlers para modal de contrato
  const handleOpenContratoDetail = (contrato) => {
    setSelectedContrato(contrato);
    setContratoDetailOpen(true);
  };
  const handleCloseContratoDetail = () => {
    setContratoDetailOpen(false);
    setSelectedContrato(null);
  };

  // Handlers para acciones
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

  return (
    <GeometricDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      actions={
        <CommonActions
          onEdit={handleEditPropiedad}
          onDelete={handleDeletePropiedad}
          itemName={propiedadCompleta?.alias || 'esta propiedad'}
          size="medium"
          direction="row"
          showDelete={true}
          showEdit={true}
          disabled={false}
        />
      }
    >
      <GeometricModalHeader
        icon={TipoPropiedadIcon}
        title={propiedadCompleta?.alias || 'Sin alias'}
        chip={<EstadoChip estado={estadoPropiedad} tipo="PROPIEDAD" />}
        onClose={onClose}
      >
        <Typography variant="body2" color="text.secondary">
          {propiedadCompleta?.tipo} • {propiedadCompleta?.ciudad}
        </Typography>
      </GeometricModalHeader>
      <DialogContent sx={{ p: 2, pt: 1, backgroundColor: theme.palette.collapseHeader.background }}>
        <EntityDetailSections sections={getPropiedadDetailSections()} />
      </DialogContent>
      <ContratoDetail
        open={contratoDetailOpen}
        onClose={handleCloseContratoDetail}
        contrato={selectedContrato}
        relatedData={propiedadCompleta}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </GeometricDialog>
  );
};

export default PropiedadDetail; 