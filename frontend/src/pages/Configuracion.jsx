import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import UnderConstruction from '../components/UnderConstruction';

export function Configuracion() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar />
      <EntityDetails title="Configuración">
        <UnderConstruction />
      </EntityDetails>
    </Container>
  );
}

export default Configuracion;
