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
import EmptyState from '../components/EmptyState';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const response = await clienteAxios.get('/proyectos');
        setProyectos(response.data.docs || []);
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
        {proyectos.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <EmptyState />
          </Box>
        ) : (
          <Box>
            {proyectos.map((proyecto) => (
              <Typography key={proyecto.id}>{proyecto.nombre}</Typography>
            ))}
          </Box>
        )}
      </EntityDetails>
    </Container>
  );
}

export default Proyectos;
