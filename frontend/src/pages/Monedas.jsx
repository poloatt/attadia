import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';

export function Monedas() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        navigationItems={[]}
      />
      {/* Implementar contenido */}
    </Container>
  );
}

export default Monedas; 