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
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  DescriptionOutlined as DescriptionIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';

export function Inquilinos() {
  const [inquilinos, setInquilinos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchInquilinos();
  }, []);

  const fetchInquilinos = async () => {
    try {
      const response = await clienteAxios.get('/inquilinos');
      setInquilinos(response.data);
    } catch (error) {
      console.error('Error al cargar inquilinos:', error);
      enqueueSnackbar('Error al cargar inquilinos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
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
  };

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
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="h6" gutterBottom>
              No hay inquilinos registrados
            </Typography>
            <Button 
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsFormOpen(true)}
              sx={{ mt: 2 }}
            >
              Agregar Inquilino
            </Button>
          </Box>
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