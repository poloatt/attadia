import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ScienceOutlined as LabIcon,
  TaskAltOutlined as RutinasIcon
} from '@mui/icons-material';
import { 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';
import clienteAxios from '../config/axios';
import EmptyState from '../components/EmptyState';

export function Dieta() {
  const [dietas, setDietas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [nuevaDieta, setNuevaDieta] = useState({
    tipo: '',
    calorias: '',
    proteinas: '',
    carbohidratos: '',
    grasas: '',
    notas: ''
  });

  useEffect(() => {
    fetchDietas();
  }, []);

  const fetchDietas = async () => {
    try {
      const response = await clienteAxios.get('/dietas');
      setDietas(response.data);
    } catch (error) {
      console.error('Error al cargar dietas:', error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNuevaDieta({
      tipo: '',
      calorias: '',
      proteinas: '',
      carbohidratos: '',
      grasas: '',
      notas: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaDieta(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await clienteAxios.post('/dietas', nuevaDieta);
      handleCloseDialog();
      fetchDietas();
    } catch (error) {
      console.error('Error al crear dieta:', error);
    }
  };

  const tiposDieta = [
    'Desayuno',
    'Almuerzo',
    'Cena',
    'Snack',
    'Pre-entreno',
    'Post-entreno'
  ];

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
            icon: <RutinasIcon sx={{ fontSize: 20 }} />,
            label: 'Rutinas',
            to: '/rutinas'
          }
        ]}
      />
      <EntityDetails 
        title="Dietas"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={handleOpenDialog}
          >
            Nueva Dieta
          </Button>
        }
      >
        {dietas.length === 0 ? (
          <EmptyState onAdd={handleOpenDialog} />
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Calorías</TableCell>
                  <TableCell align="right">Proteínas (g)</TableCell>
                  <TableCell align="right">Carbohidratos (g)</TableCell>
                  <TableCell align="right">Grasas (g)</TableCell>
                  <TableCell>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dietas.map((dieta) => (
                  <TableRow key={dieta.id}>
                    <TableCell>{new Date(dieta.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{dieta.tipo}</TableCell>
                    <TableCell align="right">{dieta.calorias}</TableCell>
                    <TableCell align="right">{dieta.proteinas}</TableCell>
                    <TableCell align="right">{dieta.carbohidratos}</TableCell>
                    <TableCell align="right">{dieta.grasas}</TableCell>
                    <TableCell>{dieta.notas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </EntityDetails>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Nueva Dieta</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Tipo"
            name="tipo"
            value={nuevaDieta.tipo}
            onChange={handleInputChange}
          >
            {tiposDieta.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Calorías"
            name="calorias"
            type="number"
            value={nuevaDieta.calorias}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Proteínas (g)"
            name="proteinas"
            type="number"
            value={nuevaDieta.proteinas}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Carbohidratos (g)"
            name="carbohidratos"
            type="number"
            value={nuevaDieta.carbohidratos}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Grasas (g)"
            name="grasas"
            type="number"
            value={nuevaDieta.grasas}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Notas"
            name="notas"
            multiline
            rows={3}
            value={nuevaDieta.notas}
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

export default Dieta;