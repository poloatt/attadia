import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  TaskAltOutlined as RutinasIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { 
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
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';

export function Rutinas() {
  const [rutinas, setRutinas] = useState([]);

  useEffect(() => {
    // TODO: Implementar llamada a la API
    fetchRutinas();
  }, []);

  const fetchRutinas = async () => {
    try {
      const response = await fetch('/api/rutinas');
      const data = await response.json();
      setRutinas(data);
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
    }
  };

  const getCompletitudColor = (completitud) => {
    if (completitud >= 0.8) return 'success';
    if (completitud >= 0.5) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 20 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <DietaIcon sx={{ fontSize: 20 }} />,
            label: 'Dieta',
            to: '/dieta'
          }
        ]}
      />
      <EntityDetails 
        title="Rutinas"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
          >
            Nueva Rutina
          </Button>
        }
      >
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Completitud</TableCell>
                <TableCell align="right">Peso (kg)</TableCell>
                <TableCell align="right">Músculo (%)</TableCell>
                <TableCell align="right">Grasa (%)</TableCell>
                <TableCell align="right">Estrés (1-10)</TableCell>
                <TableCell align="right">Sueño (hrs)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rutinas.map((rutina) => (
                <TableRow key={rutina.id}>
                  <TableCell>
                    {new Date(rutina.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={`${(rutina.completitud * 100).toFixed(0)}%`}
                      color={getCompletitudColor(rutina.completitud)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{rutina.weight?.toFixed(1)}</TableCell>
                  <TableCell align="right">{rutina.muscle?.toFixed(1)}</TableCell>
                  <TableCell align="right">{rutina.fatPercent?.toFixed(1)}</TableCell>
                  <TableCell align="right">{rutina.stress}</TableCell>
                  <TableCell align="right">{rutina.sleep?.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </EntityDetails>
    </Container>
  );
}

export default Rutinas;
