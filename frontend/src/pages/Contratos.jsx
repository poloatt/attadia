import React, { useState, useEffect } from 'react';
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
  Paper,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';

export function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const [inquilinos, setInquilinos] = useState([]);
  const [propiedades, setPropiedades] = useState([]);

  useEffect(() => {
    fetchContratos();
    fetchRelatedData();
  }, []);

  const fetchContratos = async () => {
    try {
      const response = await axios.get('/api/contratos');
      setContratos(response.data);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      enqueueSnackbar('Error al cargar contratos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [inquilinosRes, propiedadesRes] = await Promise.all([
        axios.get('/api/inquilinos'),
        axios.get('/api/propiedades')
      ]);
      setInquilinos(inquilinosRes.data);
      setPropiedades(propiedadesRes.data);
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      enqueueSnackbar('Error al cargar datos relacionados', { variant: 'error' });
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const response = await axios.post('/api/contratos', formData);
      if (response.status === 201) {
        enqueueSnackbar('Contrato creado exitosamente', { variant: 'success' });
        setIsFormOpen(false);
        fetchContratos();
      }
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Error al crear contrato', { variant: 'error' });
    }
  };

  const formFields = [
    {
      name: 'inquilinoId',
      label: 'Inquilino',
      type: 'select',
      required: true,
      options: inquilinos.map(i => ({
        value: i.id,
        label: `${i.nombre} ${i.apellido}`
      }))
    },
    {
      name: 'propiedadId',
      label: 'Propiedad',
      type: 'select',
      required: true,
      options: propiedades.map(p => ({
        value: p.id,
        label: p.titulo
      }))
    },
    {
      name: 'fechaInicio',
      label: 'Fecha de Inicio',
      type: 'date',
      required: true
    },
    {
      name: 'fechaFin',
      label: 'Fecha de Fin',
      type: 'date',
      required: true
    },
    {
      name: 'montoAlquiler',
      label: 'Monto del Alquiler',
      type: 'number',
      required: true
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'FINALIZADO', label: 'Finalizado' },
        { value: 'CANCELADO', label: 'Cancelado' }
      ]
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => setIsFormOpen(true)}
        searchPlaceholder="Buscar contratos..."
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
            icon: <PeopleIcon sx={{ fontSize: 20 }} />,
            label: 'Inquilinos',
            to: '/inquilinos'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 20 }} />,
            label: 'Inventario',
            to: '/inventario'
          }
        ]}
      />

      <EntityDetails
        title="Contratos"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => setIsFormOpen(true)}
          >
            Nuevo Contrato
          </Button>
        }
      >
        {contratos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="h6" gutterBottom>
              No hay contratos registrados
            </Typography>
            <Button 
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsFormOpen(true)}
              sx={{ mt: 2 }}
            >
              Agregar Contrato
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Inquilino</TableCell>
                  <TableCell>Propiedad</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contratos.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell>{`${contrato.inquilino.nombre} ${contrato.inquilino.apellido}`}</TableCell>
                    <TableCell>{contrato.propiedad.titulo}</TableCell>
                    <TableCell>{new Date(contrato.fechaInicio).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(contrato.fechaFin).toLocaleDateString()}</TableCell>
                    <TableCell align="right">${contrato.montoAlquiler}</TableCell>
                    <TableCell>
                      <Chip 
                        label={contrato.estado}
                        color={
                          contrato.estado === 'ACTIVO' ? 'success' : 
                          contrato.estado === 'FINALIZADO' ? 'default' : 
                          'error'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
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
        title="Nuevo Contrato"
        fields={formFields}
      />
    </Container>
  );
}

export default Contratos; 