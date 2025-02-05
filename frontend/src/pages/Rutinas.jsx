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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';
import clienteAxios from '../config/axios';

export function Rutinas() {
  const [rutinas, setRutinas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [nuevaRutina, setNuevaRutina] = useState({
    weight: '',
    muscle: '',
    fatPercent: '',
    stress: '',
    sleep: '',
    completitud: 0
  });

  useEffect(() => {
    fetchRutinas();
  }, []);

  const fetchRutinas = async () => {
    try {
      const response = await clienteAxios.get('/rutinas');
      setRutinas(response.data);
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNuevaRutina({
      weight: '',
      muscle: '',
      fatPercent: '',
      stress: '',
      sleep: '',
      completitud: 0
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaRutina(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await clienteAxios.post('/rutinas', nuevaRutina);
      handleCloseDialog();
      fetchRutinas();
    } catch (error) {
      console.error('Error al crear rutina:', error);
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
        onAdd={handleOpenDialog}
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
            onClick={handleOpenDialog}
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

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Nueva Rutina</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Peso (kg)"
            name="weight"
            type="number"
            value={nuevaRutina.weight}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Músculo (%)"
            name="muscle"
            type="number"
            value={nuevaRutina.muscle}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Grasa (%)"
            name="fatPercent"
            type="number"
            value={nuevaRutina.fatPercent}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Estrés (1-10)"
            name="stress"
            type="number"
            inputProps={{ min: 1, max: 10 }}
            value={nuevaRutina.stress}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Sueño (hrs)"
            name="sleep"
            type="number"
            value={nuevaRutina.sleep}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Rutinas;
