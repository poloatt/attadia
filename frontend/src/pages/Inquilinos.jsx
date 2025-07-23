import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { InquilinoList, InquilinoForm } from '../components/propiedades/inquilinos';
import InquilinoDetail from '../components/propiedades/inquilinos/InquilinoDetail';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { CommonDetails, CommonActions } from '../components/common';
import { Toolbar } from '../navigation';

import {
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  DescriptionOutlined as ContratosIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import ContratoForm from '../components/propiedades/contratos/ContratoForm';
import { useFormManager } from '../context/FormContext';

export function Inquilinos() {
  const [inquilinos, setInquilinos] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('activos'); // 'activos', 'inactivos', 'todos'
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const [openContratoForm, setOpenContratoForm] = useState(false);
  const [contratoInitialData, setContratoInitialData] = useState({});
  const [cuentas, setCuentas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  // --- NUEVO: Contexto de formularios ---
  const { openForm, closeForm, getFormState } = useFormManager();
  const { open, initialData } = getFormState('inquilino');
  const [selectedInquilino, setSelectedInquilino] = useState(null);

  const handleBack = () => {
    navigate('/');
  };

  // Abrir formulario tras redirección si openAdd está en el estado
  useEffect(() => {
    if (location.state?.openAdd) {
      openForm('inquilino');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, openForm, navigate]);

  // Escuchar evento del Header para abrir formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (
        (event.detail?.path && event.detail.path === location.pathname) ||
        event.detail?.type === 'inquilino'
      ) {
        openForm('inquilino');
      }
    };
    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
  }, [openForm, location.pathname]);

  // Cargar inquilinos
  const fetchInquilinos = async (propiedadId = null) => {
    setIsLoading(true);
    try {
      const url = propiedadId 
        ? `/api/inquilinos?propiedad=${propiedadId}&limit=100`
        : '/api/inquilinos?limit=100';
      const response = await clienteAxios.get(url);
      console.log('Inquilinos obtenidos:', response.data.docs);
      setInquilinos(response.data.docs);
    } catch (error) {
      console.error('Error al cargar inquilinos:', error);
      enqueueSnackbar('Error al cargar inquilinos', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar propiedades
  const fetchPropiedades = async () => {
    try {
      const response = await clienteAxios.get('/api/propiedades');
      setPropiedades(response.data.docs);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      enqueueSnackbar('Error al cargar propiedades', { variant: 'error' });
    }
  };

  // Cargar cuentas
  const fetchCuentas = async () => {
    try {
      const response = await clienteAxios.get('/api/cuentas');
      setCuentas(response.data.docs);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      enqueueSnackbar('Error al cargar cuentas', { variant: 'error' });
    }
  };

  // Cargar monedas
  const fetchMonedas = async () => {
    try {
      const response = await clienteAxios.get('/api/monedas');
      setMonedas(response.data.docs);
    } catch (error) {
      console.error('Error al cargar monedas:', error);
      enqueueSnackbar('Error al cargar monedas', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchInquilinos();
    fetchPropiedades();
    fetchCuentas();
    fetchMonedas();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      if (initialData) {
        await clienteAxios.put(`/api/inquilinos/${initialData._id}`, formData);
        enqueueSnackbar('Inquilino actualizado correctamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/api/inquilinos', formData);
        enqueueSnackbar('Inquilino creado correctamente', { variant: 'success' });
      }
      fetchInquilinos();
      closeForm('inquilino');
    } catch (error) {
      console.error('Error al guardar inquilino:', error);
      throw error;
    }
  };

  const handleEdit = (inquilino) => {
    openForm('inquilino', inquilino);
  };

  const handleDelete = async (inquilino) => {
    if (!window.confirm('¿Estás seguro de eliminar este inquilino?')) return;
    
    try {
      await clienteAxios.delete(`/api/inquilinos/${inquilino._id}`);
      enqueueSnackbar('Inquilino eliminado correctamente', { variant: 'success' });
      fetchInquilinos();
    } catch (error) {
      console.error('Error al eliminar inquilino:', error);
      enqueueSnackbar('Error al eliminar el inquilino', { variant: 'error' });
    }
  };

  const handleCloseForm = () => {
    closeForm('inquilino');
  };

  const handleCreateContract = (inquilino) => {
    // 1. Buscar la propiedad asociada al inquilino
    const propiedad = propiedades.find(p => p._id === inquilino.propiedad || p.id === inquilino.propiedad);

    // 2. Buscar la cuenta asociada a la propiedad
    let cuentaObj = null;
    if (propiedad?.cuenta && cuentas && cuentas.length > 0) {
      if (typeof propiedad.cuenta === 'object') {
        cuentaObj = propiedad.cuenta;
      } else {
        cuentaObj = cuentas.find(c => c._id === propiedad.cuenta || c.id === propiedad.cuenta) || '';
      }
    }
    // Si no hay cuenta, busca una por defecto
    if (!cuentaObj && cuentas && cuentas.length > 0) {
      cuentaObj = cuentas.find(c => c.activo !== false) || cuentas[0];
    }

    // 3. Preparar initialData con los datos correctos
    const initialData = {
      inquilino: [inquilino._id],
      propiedad: propiedad?._id || propiedad?.id || '',
      cuenta: cuentaObj?._id || cuentaObj?.id || '',
      montoMensual: propiedad?.montoMensual?.toString() || '0',
      deposito: propiedad?.deposito?.toString() || (propiedad?.montoMensual ? (propiedad.montoMensual * 2).toString() : '0'),
      esMantenimiento: false,
      tipoContrato: 'ALQUILER'
    };

    console.log('initialData para contrato:', initialData, { propiedad, cuentaObj, inquilino });

    setContratoInitialData(initialData);
    setOpenContratoForm(true);
  };

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <Toolbar />

      <Box sx={{
        width: '100%',
        maxWidth: 900,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: 2,
        pb: { xs: 10, sm: 4 },
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 0
      }}>
        {/* Filtros de grupos */}

        <Box
          sx={{
            py: 2,
            display: isDesktop ? 'flex' : 'block',
            gap: isDesktop ? 3 : 0,
            alignItems: 'flex-start',
            width: '100%'
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CommonDetails>
              <InquilinoList
                inquilinos={inquilinos}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateContract={handleCreateContract}
                onCardClick={isDesktop ? setSelectedInquilino : undefined}
              />
            </CommonDetails>
          </Box>
          {isDesktop && selectedInquilino && (
            <Box sx={{ flex: 1.2, minWidth: 0, ml: 2 }}>
              <InquilinoDetail
                open={true}
                onClose={() => setSelectedInquilino(null)}
                inquilino={selectedInquilino}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Box>
          )}
        </Box>

        <InquilinoForm
          open={open}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          initialData={initialData}
          propiedades={propiedades}
        />

        {/* Formulario de contrato autopopulado */}
        {openContratoForm && (
          <ContratoForm
            initialData={contratoInitialData}
            relatedData={{ propiedades, inquilinos, cuentas, monedas }}
            onClose={() => setOpenContratoForm(false)}
            onSubmit={() => { setOpenContratoForm(false); fetchInquilinos(); }}
          />
        )}
      </Box>
    </Box>
  );
}

export default Inquilinos;
