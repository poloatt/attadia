import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  HomeOutlined as HomeIcon,
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CurrencyExchangeOutlined as MoneyIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';
import axios from 'axios';
import { useSnackbar } from 'notistack';

export function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchTransacciones = async () => {
      try {
        const response = await axios.get('/api/transacciones');
        setTransacciones(response.data || []);
      } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        setTransacciones([]);
        enqueueSnackbar('Error al cargar transacciones', { 
          variant: 'error',
          autoHideDuration: 3000
        });
      }
    };
    fetchTransacciones();
  }, [enqueueSnackbar]);

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        navigationItems={[
          {
            icon: <BankIcon sx={{ fontSize: 18 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <MoneyIcon sx={{ fontSize: 18 }} />,
            label: 'Monedas',
            to: '/monedas'
          }
        ]}
      />
      <EntityDetails 
        title="Transacciones"
        action={
          <Button variant="contained" startIcon={<AddIcon />} size="small">
            Nueva Transacción
          </Button>
        }
      >
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Moneda</TableCell>
                <TableCell>Cuenta</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Locación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transacciones.map((trans) => (
                <TableRow key={trans.id}>
                  <TableCell>{new Date(trans.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>{trans.descripcion}</TableCell>
                  <TableCell align="right">{trans.monto.toFixed(2)}</TableCell>
                  <TableCell>{trans.moneda}</TableCell>
                  <TableCell>{trans.cuenta}</TableCell>
                  <TableCell>
                    <Chip 
                      label={trans.estado}
                      color={trans.estado === 'PAGADO' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{trans.categoria}</TableCell>
                  <TableCell>{trans.locacion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </EntityDetails>
    </Container>
  );
}

export default Transacciones;
