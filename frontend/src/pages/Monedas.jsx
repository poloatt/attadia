import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import AddIcon from '@mui/icons-material/Add';
import { 
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EntityTable from '../components/EntityViews/EntityTable';
import EntityCards from '../components/EntityViews/EntityCards';

export function Monedas() {
  const [monedas, setMonedas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchMonedas();
  }, []);

  const fetchMonedas = async () => {
    try {
      const response = await clienteAxios.get('/monedas');
      setMonedas(response.data);
    } catch (error) {
      console.error('Error al cargar monedas:', error);
      enqueueSnackbar('Error al cargar monedas', { variant: 'error' });
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const response = await clienteAxios.post('/monedas', formData);
      setMonedas(prev => [...prev, response.data]);
      setIsFormOpen(false);
      enqueueSnackbar('Moneda creada exitosamente', { variant: 'success' });
      fetchMonedas(); // Recargar la lista
    } catch (error) {
      console.error('Error al crear moneda:', error);
      enqueueSnackbar('Error al crear la moneda', { variant: 'error' });
    }
  };

  const formFields = [
    {
      name: 'codigo',
      label: 'Código',
      type: 'text',
      required: true
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true
    },
    {
      name: 'simbolo',
      label: 'Símbolo',
      type: 'text',
      required: true
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => setIsFormOpen(true)}
        entityName="moneda"
        navigationItems={[
          {
            icon: <BankIcon sx={{ fontSize: 18 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <WalletIcon sx={{ fontSize: 18 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          }
        ]}
      />
      
      <EntityDetails 
        title="Monedas"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => setIsFormOpen(true)}
          >
            Nueva Moneda
          </Button>
        }
      >
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Símbolo</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monedas.map((moneda) => (
                <TableRow key={moneda._id}>
                  <TableCell>{moneda.codigo}</TableCell>
                  <TableCell>{moneda.nombre}</TableCell>
                  <TableCell>{moneda.simbolo}</TableCell>
                  <TableCell>
                    <Chip 
                      label={moneda.activa ? 'Activa' : 'Inactiva'}
                      size="small"
                      color={moneda.activa ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        title="Nueva Moneda"
        fields={formFields}
      />
    </Container>
  );
}

export default Monedas; 