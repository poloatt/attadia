import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityDetails';
import axios from 'axios';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const response = await axios.get('/api/proyectos');
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
      <EntityDetails>
        {proyectos.length > 0 ? (
          <div>Lista de proyectos aquí</div>
        ) : null}
      </EntityDetails>
    </Container>
  );
}

export default Proyectos;
