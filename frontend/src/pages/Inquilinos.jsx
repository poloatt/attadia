import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { InquilinoList, InquilinoForm } from '../components/propiedades/inquilinos';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityToolbar from '../components/EntityToolbar';
import { EntityActions } from '../components/EntityViews/EntityActions';

import {
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  DescriptionOutlined as ContratosIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useNavigate } from 'react-router-dom';
import ContratoForm from '../components/propiedades/contratos/ContratoForm';

export function Inquilinos() {
  const [inquilinos, setInquilinos] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedInquilino, setSelectedInquilino] = useState(null);
  const [activeFilter, setActiveFilter] = useState('activos'); // 'activos', 'inactivos', 'todos'
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [openContratoForm, setOpenContratoForm] = useState(false);
  const [contratoInitialData, setContratoInitialData] = useState({});
  const [cuentas, setCuentas] = useState([]);
  const [monedas, setMonedas] = useState([]);

  const handleBack = () => {
    navigate('/');
  };

  // Escuchar el evento del Header para abrir el formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'inquilino') {
        setOpenForm(true);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);

    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
    };
  }, []);

  // Cargar inquilinos
  const fetchInquilinos = async (propiedadId = null) => {
    setIsLoading(true);
    try {
      const url = propiedadId 
        ? `/api/inquilinos?propiedad=${propiedadId}`
        : '/api/inquilinos';
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
      if (selectedInquilino) {
        await clienteAxios.put(`/api/inquilinos/${selectedInquilino._id}`, formData);
        enqueueSnackbar('Inquilino actualizado correctamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/api/inquilinos', formData);
        enqueueSnackbar('Inquilino creado correctamente', { variant: 'success' });
      }
      fetchInquilinos();
      handleCloseForm();
    } catch (error) {
      console.error('Error al guardar inquilino:', error);
      throw error;
    }
  };

  const handleEdit = (inquilino) => {
    setSelectedInquilino(inquilino);
    setOpenForm(true);
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
    setSelectedInquilino(null);
    setOpenForm(false);
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

  return (
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
      gap: 2
    }}>
      <EntityToolbar additionalActions={[{
        icon: <EntityActions onEdit={() => {}} onDelete={() => {}} />, // Puedes personalizar las acciones
        label: 'Acciones'
      }]} />


      {/* Filtros de grupos */}

      <Box sx={{ py: 2 }}>
        <EntityDetails>
          <InquilinoList
            inquilinos={inquilinos}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateContract={handleCreateContract}
          />
        </EntityDetails>
      </Box>

      <InquilinoForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedInquilino}
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
  );
}

export default Inquilinos;
