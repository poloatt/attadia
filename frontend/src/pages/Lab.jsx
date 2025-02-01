import { useState, useEffect } from 'react';
import { 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';
import axios from 'axios';

export default function Lab() {
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    fetchResultados();
  }, []);

  const fetchResultados = async () => {
    try {
      const response = await axios.get('/api/lab');
      const data = await response.data;
      setResultados(data);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
    }
  };

  return (
    <EntityDetails 
      title="Laboratorio"
      action={
        <Button variant="contained" startIcon={<AddIcon />} size="small">
          Nuevo Resultado
        </Button>
      }
    >
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Unidad</TableCell>
              <TableCell>Notas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resultados.map((result) => (
              <TableRow key={result.id}>
                <TableCell>{new Date(result.fecha).toLocaleDateString()}</TableCell>
                <TableCell>{result.tipo}</TableCell>
                <TableCell align="right">{result.valor.toFixed(2)}</TableCell>
                <TableCell>{result.unidad}</TableCell>
                <TableCell>{result.notas}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </EntityDetails>
  );
}
