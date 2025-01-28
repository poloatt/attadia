import { useState, useEffect } from 'react';
import { 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Inventario() {
  const [inventario, setInventario] = useState([]);

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      const response = await fetch('/api/inventario');
      const data = await response.json();
      setInventario(data);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    }
  };

  return (
    <EntityDetails 
      title="Inventario"
      action={
        <Button variant="contained" startIcon={<AddIcon />} size="small">
          Nuevo Item
        </Button>
      }
    >
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Locación</TableCell>
              <TableCell>Sublocación</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Tipo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventario.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.item}</TableCell>
                <TableCell>{item.categoria}</TableCell>
                <TableCell>{item.locacion}</TableCell>
                <TableCell>{item.sublocacion}</TableCell>
                <TableCell align="right">{item.cantidad}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.consumible ? 'Consumible' : 'No consumible'}
                    color={item.consumible ? 'warning' : 'info'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </EntityDetails>
  );
}
