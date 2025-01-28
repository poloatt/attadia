import { useState, useEffect } from 'react';
import { 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    fetchProyectos();
  }, []);

  const fetchProyectos = async () => {
    try {
      const response = await fetch('/api/proyectos');
      const data = await response.json();
      setProyectos(data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'COMPLETADO': return 'success';
      case 'EN_PROGRESO': return 'info';
      case 'PENDIENTE': return 'warning';
      case 'CANCELADO': return 'error';
      default: return 'default';
    }
  };

  return (
    <EntityDetails 
      title="Proyectos"
      action={
        <Button variant="contained" startIcon={<AddIcon />} size="small">
          Nuevo Proyecto
        </Button>
      }
    >
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell align="right">Tareas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proyectos.map((proyecto) => (
              <TableRow key={proyecto.id}>
                <TableCell>{proyecto.titulo}</TableCell>
                <TableCell>{proyecto.descripcion}</TableCell>
                <TableCell>{new Date(proyecto.fechaInicio).toLocaleDateString()}</TableCell>
                <TableCell>
                  {proyecto.fechaFin ? new Date(proyecto.fechaFin).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={proyecto.estado}
                    color={getEstadoColor(proyecto.estado)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{proyecto.tags.join(', ')}</TableCell>
                <TableCell align="right">{proyecto.tareas?.length || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </EntityDetails>
  );
}
