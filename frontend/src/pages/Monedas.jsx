import React, { useState, useEffect, useCallback } from 'react';
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
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';

export function Monedas() {
  const [monedas, setMonedas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMoneda, setEditingMoneda] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchMonedas = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/monedas');
      setMonedas(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar monedas:', error);
      enqueueSnackbar('Error al cargar monedas', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchMonedas();
  }, [fetchMonedas]);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      let response;
      if (editingMoneda) {
        response = await clienteAxios.put(`/monedas/${editingMoneda.id}`, formData);
        setMonedas(prev => prev.map(m => m.id === editingMoneda.id ? response.data : m));
        enqueueSnackbar('Moneda actualizada exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/monedas', formData);
        setMonedas(prev => [...prev, response.data]);
        enqueueSnackbar('Moneda creada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingMoneda(null);
      await fetchMonedas();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la moneda', 
        { variant: 'error' }
      );
    }
  }, [enqueueSnackbar, editingMoneda, fetchMonedas]);

  const handleEdit = useCallback((moneda) => {
    setEditingMoneda(moneda);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/monedas/${id}`);
      setMonedas(prev => prev.filter(m => m.id !== id));
      enqueueSnackbar('Moneda eliminada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al eliminar moneda:', error);
      enqueueSnackbar('Error al eliminar la moneda', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

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
        onAdd={() => {
          setEditingMoneda(null);
          setIsFormOpen(true);
        }}
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
            onClick={() => {
              setEditingMoneda(null);
              setIsFormOpen(true);
            }}
          >
            Nueva Moneda
          </Button>
        }
      >
        {monedas.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Símbolo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monedas.map((moneda) => (
                  <TableRow key={moneda.id}>
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
                    <TableCell align="right">
                      <EntityActions
                        onEdit={() => handleEdit(moneda)}
                        onDelete={() => handleDelete(moneda.id)}
                        itemName={`la moneda ${moneda.nombre}`}
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
        onClose={() => {
          setIsFormOpen(false);
          setEditingMoneda(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingMoneda ? 'Editar Moneda' : 'Nueva Moneda'}
        fields={formFields}
        initialData={editingMoneda || {}}
        isEditing={!!editingMoneda}
      />
    </Container>
  );
}

export default Monedas; 