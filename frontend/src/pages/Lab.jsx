import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  RestaurantOutlined as DietaIcon,
  TaskAltOutlined as RutinasIcon
} from '@mui/icons-material';
import { 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';
import clienteAxios from '../config/axios';
import EmptyState from '../components/EmptyState';

export default function Lab() {
  const [resultados, setResultados] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [nuevoResultado, setNuevoResultado] = useState({
    tipo: '',
    valor: '',
    unidad: '',
    notas: ''
  });

  useEffect(() => {
    fetchResultados();
  }, []);

  const fetchResultados = async () => {
    try {
      const response = await clienteAxios.get('/labs');
      setResultados(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      setResultados([]);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNuevoResultado({
      tipo: '',
      valor: '',
      unidad: '',
      notas: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoResultado(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await clienteAxios.post('/labs', nuevoResultado);
      handleCloseDialog();
      fetchResultados();
    } catch (error) {
      console.error('Error al crear resultado:', error);
    }
  };

  const tiposLab = [
    'Glucosa',
    'Colesterol',
    'Triglicéridos',
    'HDL',
    'LDL',
    'Hemoglobina',
    'Otro'
  ];

  const unidadesLab = [
    'mg/dL',
    'g/dL',
    'mmol/L',
    '%',
    'U/L',
    'Otro'
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={handleOpenDialog}
        navigationItems={[
          {
            icon: <DietaIcon sx={{ fontSize: 20 }} />,
            label: 'Dieta',
            to: '/dieta'
          },
          {
            icon: <RutinasIcon sx={{ fontSize: 20 }} />,
            label: 'Rutinas',
            to: '/rutinas'
          }
        ]}
      />
      <EntityDetails 
        title="Laboratorio"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={handleOpenDialog}
          >
            Nuevo Resultado
          </Button>
        }
      >
        {resultados.length === 0 ? (
          <EmptyState onAdd={handleOpenDialog} />
        ) : (
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
        )}
      </EntityDetails>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Nuevo Resultado de Laboratorio</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Tipo"
            name="tipo"
            value={nuevoResultado.tipo}
            onChange={handleInputChange}
          >
            {tiposLab.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Valor"
            name="valor"
            type="number"
            value={nuevoResultado.valor}
            onChange={handleInputChange}
          />
          <TextField
            select
            fullWidth
            margin="normal"
            label="Unidad"
            name="unidad"
            value={nuevoResultado.unidad}
            onChange={handleInputChange}
          >
            {unidadesLab.map((unidad) => (
              <MenuItem key={unidad} value={unidad}>
                {unidad}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Notas"
            name="notas"
            multiline
            rows={3}
            value={nuevoResultado.notas}
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
