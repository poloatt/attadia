import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import { 
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  AutorenewOutlined as RecurrentIcon,
  AddOutlined as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutlineOutlined as DeleteIcon,
  PauseOutlined as PauseIcon,
  PlayArrowOutlined as PlayIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';
import TransaccionRecurrenteForm from '../components/transaccionesrecurrentes/TransaccionRecurrenteForm';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

const RecurrenteCard = ({ 
  transaccion, 
  onEdit, 
  onDelete, 
  onToggleEstado,
  showValues,
  relatedData
}) => {
  const getFrecuenciaLabel = (frecuencia) => {
    const labels = {
      'MENSUAL': 'Mensual',
      'TRIMESTRAL': 'Trimestral',
      'SEMESTRAL': 'Semestral',
      'ANUAL': 'Anual'
    };
    return labels[frecuencia] || frecuencia;
  };

  const getMonedaSymbol = (cuentaId) => {
    const cuenta = relatedData.cuentas?.find(c => c._id === cuentaId);
    return cuenta?.moneda?.simbolo || '$';
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 1
        }
      }}
    >
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {transaccion.descripcion}
          </Typography>
          <Chip 
            label={getFrecuenciaLabel(transaccion.frecuencia)}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="h5" sx={{ 
          color: transaccion.tipo === 'INGRESO' ? 'success.main' : 'error.main',
          mb: 2
        }}>
          {showValues ? 
            `${getMonedaSymbol(transaccion.cuenta)} ${transaccion.monto}` : 
            '****'
          }
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={transaccion.categoria}
            size="small"
            variant="outlined"
          />
          <Chip 
            label={`Día ${transaccion.diaDelMes}`}
            size="small"
            variant="outlined"
          />
          {transaccion.propiedad && (
            <Chip 
              label={relatedData.propiedades?.find(p => p._id === transaccion.propiedad)?.titulo}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton 
          size="small" 
          onClick={() => onToggleEstado(transaccion)}
          color={transaccion.estado === 'ACTIVO' ? 'warning' : 'success'}
        >
          {transaccion.estado === 'ACTIVO' ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => onEdit(transaccion)}
          color="primary"
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => onDelete(transaccion._id)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export function Recurrente() {
  const [transacciones, setTransacciones] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaccion, setEditingTransaccion] = useState(null);
  const [relatedData, setRelatedData] = useState({
    cuentas: [],
    propiedades: []
  });
  const { enqueueSnackbar } = useSnackbar();
  const { showValues } = useValuesVisibility();

  const fetchRelatedData = useCallback(async () => {
    try {
      const [cuentasRes, propiedadesRes] = await Promise.all([
        clienteAxios.get('/cuentas'),
        clienteAxios.get('/propiedades')
      ]);

      setRelatedData({
        cuentas: cuentasRes.data.docs || [],
        propiedades: propiedadesRes.data.docs || []
      });
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      enqueueSnackbar('Error al cargar datos relacionados', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchTransacciones = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/transaccionesrecurrentes');
      setTransacciones(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar transacciones recurrentes:', error);
      enqueueSnackbar('Error al cargar transacciones recurrentes', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchRelatedData();
    fetchTransacciones();
  }, [fetchRelatedData, fetchTransacciones]);

  const handleFormSubmit = async (formData) => {
    try {
      if (editingTransaccion) {
        await clienteAxios.put(`/transaccionesrecurrentes/${editingTransaccion._id}`, formData);
        enqueueSnackbar('Transacción recurrente actualizada exitosamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/transaccionesrecurrentes', formData);
        enqueueSnackbar('Transacción recurrente creada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingTransaccion(null);
      fetchTransacciones();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la transacción recurrente', 
        { variant: 'error' }
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await clienteAxios.delete(`/transaccionesrecurrentes/${id}`);
      enqueueSnackbar('Transacción recurrente eliminada exitosamente', { variant: 'success' });
      fetchTransacciones();
    } catch (error) {
      console.error('Error al eliminar transacción recurrente:', error);
      enqueueSnackbar('Error al eliminar la transacción recurrente', { variant: 'error' });
    }
  };

  const handleToggleEstado = async (transaccion) => {
    try {
      const nuevoEstado = transaccion.estado === 'ACTIVO' ? 'PAUSADO' : 'ACTIVO';
      await clienteAxios.put(`/transaccionesrecurrentes/${transaccion._id}`, {
        estado: nuevoEstado
      });
      enqueueSnackbar(
        `Transacción recurrente ${nuevoEstado === 'ACTIVO' ? 'activada' : 'pausada'} exitosamente`, 
        { variant: 'success' }
      );
      fetchTransacciones();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      enqueueSnackbar('Error al cambiar el estado', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingTransaccion(null);
          setIsFormOpen(true);
        }}
        navigationItems={[
          {
            icon: <WalletIcon sx={{ fontSize: 20 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          },
          {
            icon: <BankIcon sx={{ fontSize: 20 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <CurrencyIcon sx={{ fontSize: 20 }} />,
            label: 'Monedas',
            to: '/monedas'
          }
        ]}
      />

      <EntityDetails
        title="Transacciones Recurrentes"
        subtitle="Gestiona tus transacciones periódicas"
        icon={<RecurrentIcon />}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => {
              setEditingTransaccion(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 1 }}
          >
            Nueva Transacción Recurrente
          </Button>
        }
      >
        {transacciones.length === 0 ? (
          <EmptyState 
            onAdd={() => setIsFormOpen(true)}
            message="No hay transacciones recurrentes configuradas"
            submessage="Haz clic en el botón para agregar una nueva transacción recurrente"
          />
        ) : (
          <Grid container spacing={2}>
            {transacciones.map((transaccion) => (
              <Grid item xs={12} sm={6} md={4} key={transaccion._id}>
                <RecurrenteCard
                  transaccion={transaccion}
                  onEdit={() => {
                    setEditingTransaccion(transaccion);
                    setIsFormOpen(true);
                  }}
                  onDelete={handleDelete}
                  onToggleEstado={handleToggleEstado}
                  showValues={showValues}
                  relatedData={relatedData}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </EntityDetails>

      <TransaccionRecurrenteForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaccion(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTransaccion}
        relatedData={relatedData}
        isEditing={!!editingTransaccion}
      />
    </Container>
  );
}

export default Recurrente; 