import React, { useState, useEffect } from 'react';
import { 
  Container,
  Box,
  Typography,
  Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import clienteAxios from '../config/axios';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const response = await clienteAxios.get('/proyectos');
        setProyectos(response.data || []);
      } catch (error) {
        console.error('Error:', error);
        setProyectos([]);
      }
    };
    fetchProyectos();
  }, []);

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        entityName="proyecto"
        navigationItems={[]}
      />
      <EntityDetails
        title="Proyectos"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {}}
          >
            Nuevo Proyecto
          </Button>
        }
      >
        {proyectos.length === 0 && (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              color: 'text.secondary',
              bgcolor: 'background.default',
              borderRadius: 1,
              p: 3
            }}
          >
            <Typography variant="body1" sx={{ mb: 2 }}>
              No hay datos para mostrar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {}}
            >
              Crear Proyecto
            </Button>
          </Box>
        )}
      </EntityDetails>
    </Container>
  );
}

export default Proyectos;
