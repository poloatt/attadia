import { useState, useEffect } from 'react';
import { 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);

  useEffect(() => {
    fetchTransacciones();
  }, []);

  const fetchTransacciones = async () => {
    try {
      const response = await fetch('/api/transacciones');
      const data = await response.json();
      setTransacciones(data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  };

  return (
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
  );
}
