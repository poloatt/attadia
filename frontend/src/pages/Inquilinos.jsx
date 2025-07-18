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

  // Filtrar inquilinos según el filtro activo
  const inquilinosFiltrados = useMemo(() => {
    if (activeFilter === 'activos') {
      return inquilinos.filter(inquilino => {
        const estado = inquilino.estado || 'PENDIENTE';
        return ['ACTIVO', 'RESERVADO', 'PENDIENTE'].includes(estado);
      });
    } else if (activeFilter === 'inactivos') {
      return inquilinos.filter(inquilino => {
        const estado = inquilino.estado || 'PENDIENTE';
        return ['INACTIVO', 'SIN_CONTRATO'].includes(estado);
      });
    }
    return inquilinos.filter(inquilino => {
      const estado = inquilino.estado || 'PENDIENTE';
      return ['ACTIVO', 'RESERVADO', 'PENDIENTE'].includes(estado);
    });
  }, [inquilinos, activeFilter]);

  // Memorizar conteos para evitar recálculos en cada renderizado
  const conteoInquilinos = useMemo(() => {
    const activos = inquilinos.filter(i => ['ACTIVO', 'RESERVADO', 'PENDIENTE'].includes(i.estado || 'PENDIENTE')).length;
    const inactivos = inquilinos.filter(i => ['INACTIVO', 'SIN_CONTRATO'].includes(i.estado || 'PENDIENTE')).length;
    return { activos, inactivos };
  }, [inquilinos]);

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar />


      {/* Filtros de grupos */}
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 1 }}>
        <Chip
          label={`Inquilinos Activos (${conteoInquilinos.activos})`}
          onClick={() => setActiveFilter('activos')}
          color={activeFilter === 'activos' ? 'primary' : 'default'}
          variant={activeFilter === 'activos' ? 'filled' : 'outlined'}
          sx={{ 
            borderRadius: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
            fontWeight: 500
          }}
        />
        <Chip
          label={`Inquilinos Inactivos (${conteoInquilinos.inactivos})`}
          onClick={() => setActiveFilter('inactivos')}
          color={activeFilter === 'inactivos' ? 'primary' : 'default'}
          variant={activeFilter === 'inactivos' ? 'filled' : 'outlined'}
          sx={{ 
            borderRadius: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
            fontWeight: 500
          }}
        />
      </Box>

      <Box sx={{ py: 2 }}>
        <EntityDetails>
          <InquilinoList
            inquilinos={inquilinosFiltrados}
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
