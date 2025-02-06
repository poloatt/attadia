import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Button, 
  Box, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  DescriptionOutlined as DescriptionIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';
import EmptyState from '../components/EmptyState';

export function Inquilinos() {
  const [inquilinos, setInquilinos] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [formData, setFormData] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchInquilinos();
    fetchRelatedData();
  }, []);

  // Función para cargar inquilinos
  const fetchInquilinos = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/inquilinos');
      setInquilinos(response.data);
    } catch (error) {
      console.error('Error al cargar inquilinos:', error);
      enqueueSnackbar('Error al cargar inquilinos', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // Función para cargar datos relacionados
  const fetchRelatedData = useCallback(async () => {
    try {
      const [propiedadesRes, contratosRes, monedasRes] = await Promise.all([
        clienteAxios.get('/propiedades'),
        clienteAxios.get('/contratos'),
        clienteAxios.get('/monedas')
      ]);
      setPropiedades(propiedadesRes.data);
      setContratos(contratosRes.data);
      setMonedas(monedasRes.data);
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      enqueueSnackbar('Error al cargar datos relacionados', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // Función para crear una nueva propiedad
  const handleCreatePropiedad = useCallback(async (formData) => {
    try {
      const response = await clienteAxios.post('/propiedades', formData);
      setPropiedades(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      throw error;
    }
  }, []);

  // Función para crear un nuevo contrato
  const handleCreateContrato = useCallback(async (data) => {
    try {
      const response = await clienteAxios.post('/contratos', {
        ...data,
        propiedadId: formData.propiedadId
      });
      setContratos(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error al crear contrato:', error);
      throw error;
    }
  }, [formData.propiedadId]);

  // Función para manejar el envío del formulario
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      const response = await clienteAxios.post('/inquilinos', formData);
      if (response.status === 201) {
        enqueueSnackbar('Inquilino creado exitosamente', { variant: 'success' });
        setIsFormOpen(false);
        fetchInquilinos();
      }
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Error al crear inquilino', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchInquilinos]);

  // Configuración de campos del formulario
  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      required: true
    },
    {
      name: 'apellido',
      label: 'Apellido',
      required: true
    },
    {
      name: 'dni',
      label: 'DNI',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      required: true
    },
    {
      name: 'propiedadId',
      label: 'Propiedad',
      type: 'relational',
      required: true,
      options: propiedades.map(p => ({
        value: p.id,
        label: p.titulo
      })),
      onChange: async (value) => {
        setFormData(prev => ({ ...prev, propiedadId: value }));
      },
      onCreateNew: handleCreatePropiedad,
      createButtonText: 'Crear Nueva Propiedad',
      createTitle: 'Nueva Propiedad',
      createFields: [
        { name: 'titulo', label: 'Título', required: true },
        { name: 'descripcion', label: 'Descripción', multiline: true, rows: 3 },
        { name: 'direccion', label: 'Dirección', required: true },
        { name: 'ciudad', label: 'Ciudad', required: true },
        { name: 'estado', label: 'Estado', required: true }
      ]
    },
    {
      name: 'contratoId',
      label: 'Contrato',
      type: 'relational',
      required: true,
      options: contratos.filter(c => c.propiedadId === formData.propiedadId).map(c => ({
        value: c.id,
        label: `Contrato ${c.fechaInicio} - ${c.fechaFin}`
      })),
      disabled: !formData.propiedadId,
      onCreateNew: handleCreateContrato,
      createButtonText: 'Crear Nuevo Contrato',
      createTitle: 'Nuevo Contrato',
      createFields: [
        { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date', required: true },
        { name: 'fechaFin', label: 'Fecha de Fin', type: 'date', required: true },
        { name: 'montoAlquiler', label: 'Monto del Alquiler', type: 'number', required: true },
        { 
          name: 'monedaId', 
          label: 'Moneda',
          type: 'select',
          required: true,
          options: monedas.map(m => ({
            value: m.id,
            label: `${m.nombre} (${m.simbolo})`
          }))
        }
      ]
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => setIsFormOpen(true)}
        searchPlaceholder="Buscar inquilinos..."
        navigationItems={[
          {
            icon: <BuildingIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <BedIcon sx={{ fontSize: 20 }} />,
            label: 'Habitaciones',
            to: '/habitaciones'
          },
          {
            icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
            label: 'Contratos',
            to: '/contratos'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 20 }} />,
            label: 'Inventario',
            to: '/inventario'
          }
        ]}
      />

      <EntityDetails
        title="Inquilinos"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => setIsFormOpen(true)}
          >
            Nuevo Inquilino
          </Button>
        }
      >
        {inquilinos.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inquilinos.map((inquilino) => (
                  <TableRow key={inquilino.id}>
                    <TableCell>{`${inquilino.nombre} ${inquilino.apellido}`}</TableCell>
                    <TableCell>{inquilino.dni}</TableCell>
                    <TableCell>{inquilino.email}</TableCell>
                    <TableCell>{inquilino.telefono}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        title="Nuevo Inquilino"
        fields={formFields}
      />
    </Container>
  );
}

export default Inquilinos;