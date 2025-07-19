import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  HomeWork,
  LocationOn,
  AttachMoney,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionIcon,
  Description as ContractIcon,
  Inventory2Outlined as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  InsertDriveFile as InsertDriveFileIcon,
  SquareFoot as SquareFootIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import clienteAxios from '../../config/axios';
import { toast } from 'react-hot-toast';
import BarraEstadoPropiedad from './BarraEstadoPropiedad';
import { 
  pluralizar
} from './propiedadUtils';
import { getEstadoColor, getEstadoText, getStatusIconComponent } from '../common/StatusSystem';
import { 
  getEstadoContrato as getEstadoContratoFromUtils,
  getCuentaYMoneda as getCuentaYMonedaFromUtils,
  calcularProgresoContrato,
  getEstadoColorTheme
} from './contratos/contratoUtils';
import { StyledCard, StatusChip } from './PropiedadStyles';
import EstadoFinanzasContrato from './contratos/EstadoFinanzasContrato';
import { CuotasProvider } from './contratos/context/CuotasContext';
import InventarioDetail from './inventario/InventarioDetail';
import { SeccionInquilinos, SeccionHabitaciones, SeccionDocumentos } from './SeccionesPropiedad';
import { EntityActions } from '../EntityViews/EntityActions';

// Componentes estilizados con estilo geométrico
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '100%',
    backgroundColor: '#111',
    color: '#fff'
  }
}));



const StyledAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: 0,
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  boxShadow: 'none',
  margin: 0,
  '&:before': {
    display: 'none'
  },
  '&.Mui-expanded': {
    margin: 0
  },
  '& + &': {
    marginTop: 0 // Eliminar margen entre accordions consecutivos
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  borderRadius: 0,
  backgroundColor: '#1a1a1a',
  '&.Mui-expanded': {
    minHeight: 48
  }
}));

const PropiedadDetail = ({ propiedad, open, onClose, onEdit, onDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estado para controlar qué sección está expandida (solo una a la vez)
  const [expandedSections, setExpandedSections] = useState({
    informacionBasica: true, // Por defecto expandida
    inquilinos: false,
    contratos: false,
    habitaciones: false,
    inventario: false,
    documentos: false,
    finanzas: false
  });

  const [propiedadCompleta, setPropiedadCompleta] = useState(propiedad);

  useEffect(() => {
    if (open && propiedad?._id) {
      fetchPropiedadCompleta();
    }
  }, [open, propiedad?._id]);

  const fetchPropiedadCompleta = async () => {
    try {
      const response = await clienteAxios.get(`/api/propiedades/${propiedad._id}`, {
        params: {
          populate: 'inquilinos,contratos,habitaciones,inventarios,cuenta,moneda'
        }
      });
      setPropiedadCompleta(response.data);
    } catch (error) {
      console.error('Error al obtener propiedad completa:', error);
      toast.error('Error al cargar detalles de la propiedad');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      // Si la sección ya está expandida, la cerramos
      if (prev[section]) {
        return {
          ...prev,
          [section]: false
        };
      }
      // Si se está expandiendo, cerramos todas las demás y expandimos solo esta
      const newState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = key === section;
      });
      return newState;
    });
  };



  // Función para obtener el icono de tipo de propiedad
  const getTipoIcon = (tipo) => {
    const iconMap = {
      'CASA': <HomeWork />,
      'DEPARTAMENTO': <HomeWork />,
      'OFICINA': <HomeWork />,
      'LOCAL': <HomeWork />,
      'TERRENO': <HomeWork />
    };
    return iconMap[tipo] || <HomeWork />;
  };



  // Memoizar datos para evitar re-renderizados innecesarios
  const habitaciones = useMemo(() => propiedadCompleta?.habitaciones || [], [propiedadCompleta?.habitaciones]);
  const inquilinos = useMemo(() => propiedadCompleta?.inquilinos || [], [propiedadCompleta?.inquilinos]);
  const contratos = useMemo(() => propiedadCompleta?.contratos || [], [propiedadCompleta?.contratos]);
  const inventarios = useMemo(() => propiedadCompleta?.inventarios || [], [propiedadCompleta?.inventarios]);
  const documentos = useMemo(() => propiedadCompleta?.documentos || [], [propiedadCompleta?.documentos]);

  // Memoizar el estado de la propiedad para evitar re-renderizados del chip
  const estadoPropiedad = useMemo(() => {
    return propiedadCompleta?.estado || 'DISPONIBLE';
  }, [propiedadCompleta?.estado]);

  // Memoizar los valores del chip de estado
  const chipColor = useMemo(() => getEstadoColor(estadoPropiedad, 'PROPIEDAD'), [estadoPropiedad]);
  const chipIcon = useMemo(() => getStatusIconComponent(estadoPropiedad, 'PROPIEDAD'), [estadoPropiedad]);
  const chipText = useMemo(() => getEstadoText(estadoPropiedad, 'PROPIEDAD'), [estadoPropiedad]);



  const renderHeader = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <HomeWork sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {propiedadCompleta?.alias || 'Sin alias'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {propiedadCompleta?.tipo} • {propiedadCompleta?.ciudad}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StatusChip customcolor={chipColor}>
          {chipIcon}
          <span>{chipText}</span>
        </StatusChip>
        
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  );

  const renderInformacionBasica = () => (
    <StyledAccordion 
      expanded={expandedSections.informacionBasica}
      onChange={() => toggleSection('informacionBasica')}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon />
          <Typography variant="h6">
            Información Básica
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <AccordionDetails>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Dirección:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body1">
                {propiedadCompleta?.direccion || 'No especificada'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CategoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Tipo:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
              {getTipoIcon(propiedadCompleta?.tipo)}
              <Typography variant="body1">
                {propiedadCompleta?.tipo || 'No especificado'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SquareFootIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Metros cuadrados:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
              <SquareFootIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body1">
                {propiedadCompleta?.metrosCuadrados || 0} m²
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AttachMoney sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Moneda:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
              <AttachMoney sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body1">
                {propiedadCompleta?.moneda?.nombre || 'No especificada'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {propiedadCompleta?.descripcion && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Descripción:
            </Typography>
            <Typography variant="body1">
              {propiedadCompleta.descripcion}
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </StyledAccordion>
  );

  const renderSeccionInquilinos = () => (
    <StyledAccordion 
      expanded={expandedSections.inquilinos}
      onChange={() => toggleSection('inquilinos')}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon />
          <Typography variant="h6">
            Inquilinos ({inquilinos.length})
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <AccordionDetails>
        <SeccionInquilinos propiedad={propiedadCompleta} inquilinos={inquilinos} />
      </AccordionDetails>
    </StyledAccordion>
  );

  const renderSeccionContratos = () => (
    <StyledAccordion 
      expanded={expandedSections.contratos}
      onChange={() => toggleSection('contratos')}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContractIcon />
          <Typography variant="h6">
            Contratos ({contratos.length})
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <AccordionDetails>
        <CuotasProvider>
          <Box>
            {contratos.map((contrato, index) => {
              // Calcular progreso del contrato usando los utils
              const progresoContrato = calcularProgresoContrato(contrato);
              const { simbolo: simboloContrato } = getCuentaYMonedaFromUtils(contrato, {});
              const estadoContrato = getEstadoContratoFromUtils(contrato);
              const colorEstado = getEstadoColorTheme(estadoContrato);
              
              // Memoizar valores del chip del contrato para evitar re-renderizados
              const contratoChipColor = getEstadoColor(estadoContrato, 'CONTRATO');
              const contratoChipIcon = getStatusIconComponent(estadoContrato, 'CONTRATO');
              const contratoChipText = getEstadoText(estadoContrato, 'CONTRATO');
              
              return (
                <Box key={contrato._id || contrato.id || `contrato-${index}`} sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {contrato.tipoContrato} - {estadoContrato}
                    </Typography>
                    <StatusChip customcolor={contratoChipColor}>
                      {contratoChipIcon}
                      <span>{contratoChipText}</span>
                    </StatusChip>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha Inicio: {new Date(contrato.fechaInicio).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha Fin: {new Date(contrato.fechaFin).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {/* Barra de estado del contrato */}
                  {progresoContrato.tieneContrato && (
                    <Box sx={{ mb: 2 }}>
                      <BarraEstadoPropiedad
                        diasTranscurridos={progresoContrato.diasTranscurridos || 0}
                        diasTotales={progresoContrato.diasTotales || 0}
                        porcentaje={progresoContrato.porcentaje || 0}
                        simboloMoneda={simboloContrato}
                        montoMensual={progresoContrato.montoAcumulado || 0}
                        montoTotal={progresoContrato.montoTotal || 0}
                        color={colorEstado}
                        estado={estadoContrato}
                      />
                    </Box>
                  )}
                  
                  <EstadoFinanzasContrato contrato={contrato} />
                </Box>
              );
            })}
          </Box>
        </CuotasProvider>
      </AccordionDetails>
    </StyledAccordion>
  );

  const renderSeccionHabitaciones = () => (
    <StyledAccordion 
      expanded={expandedSections.habitaciones}
      onChange={() => toggleSection('habitaciones')}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BedIcon />
          <Typography variant="h6">
            Habitaciones ({habitaciones.length})
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <AccordionDetails>
        <SeccionHabitaciones habitaciones={habitaciones} />
      </AccordionDetails>
    </StyledAccordion>
  );

  const renderSeccionInventario = () => (
    <StyledAccordion 
      expanded={expandedSections.inventario}
      onChange={() => toggleSection('inventario')}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon />
          <Typography variant="h6">
            Inventario ({inventarios.length})
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <AccordionDetails>
        <InventarioDetail propiedad={propiedadCompleta} inventarios={inventarios} />
      </AccordionDetails>
    </StyledAccordion>
  );

  const renderSeccionDocumentos = () => (
    <StyledAccordion 
      expanded={expandedSections.documentos}
      onChange={() => toggleSection('documentos')}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InsertDriveFileIcon />
          <Typography variant="h6">
            Documentos ({documentos.length})
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <AccordionDetails>
        <SeccionDocumentos documentos={documentos} />
      </AccordionDetails>
    </StyledAccordion>
  );

  const renderAcciones = () => (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
      <EntityActions
        onEdit={onEdit}
        onDelete={onDelete}
        itemName={propiedadCompleta?.alias || 'esta propiedad'}
        size="medium"
        direction="row"
        showDelete={true}
        showEdit={true}
        disabled={false}
      />
    </Box>
  );

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {renderHeader()}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <div key="informacionBasica">{renderInformacionBasica()}</div>
          <div key="inquilinos">{renderSeccionInquilinos()}</div>
          <div key="contratos">{renderSeccionContratos()}</div>
          <div key="habitaciones">{renderSeccionHabitaciones()}</div>
          <div key="inventario">{renderSeccionInventario()}</div>
          <div key="documentos">{renderSeccionDocumentos()}</div>
        </Box>
        
        {renderAcciones()}
      </DialogContent>
    </StyledDialog>
  );
};

export default PropiedadDetail; 