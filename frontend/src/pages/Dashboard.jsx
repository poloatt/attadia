import React from 'react';
import { Container, Grid } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ApartmentOutlined as BuildingIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CalendarTodayOutlined as DailyIcon,
  AssignmentOutlined as ProjectIcon,
  TaskAltOutlined as RutinasIcon
} from '@mui/icons-material';
import EntityDetails from '../components/EntityDetails';

export function Dashboard() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar
        showAddButton={false}
        showBackButton={false}
        showDivider={false}
        navigationItems={[
          {
            icon: <WalletIcon sx={{ fontSize: 20 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          },
          {
            icon: <BuildingIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <RutinasIcon sx={{ fontSize: 20 }} />,
            label: 'Rutinas',
            to: '/rutinas'
          },
          {
            icon: <ProjectIcon sx={{ fontSize: 20 }} />,
            label: 'Proyectos',
            to: '/proyectos'
          }
        ]}
      />

      <Grid container spacing={3}>
        {/* Assets Section */}
        <Grid item xs={12}>
          <EntityDetails showTitle title="Assets">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <EntityDetails>
                  <div>Resumen de propiedades</div>
                </EntityDetails>
              </Grid>
              <Grid item xs={12} md={6}>
                <EntityDetails>
                  <div>Resumen de transacciones</div>
                </EntityDetails>
              </Grid>
            </Grid>
          </EntityDetails>
        </Grid>

        {/* Daylist Section */}
        <Grid item xs={12}>
          <EntityDetails showTitle title="Daylist">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <EntityDetails>
                  <div>Lista de tareas del día</div>
                </EntityDetails>
              </Grid>
              <Grid item xs={12} md={6}>
                <EntityDetails>
                  <div>Rutinas programadas</div>
                </EntityDetails>
              </Grid>
            </Grid>
          </EntityDetails>
        </Grid>

        {/* Projects Section */}
        <Grid item xs={12}>
          <EntityDetails showTitle title="Projects">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <EntityDetails>
                  <div>Lista de proyectos activos</div>
                </EntityDetails>
              </Grid>
              <Grid item xs={12} md={6}>
                <EntityDetails>
                  <div>Experimentos en curso</div>
                </EntityDetails>
              </Grid>
            </Grid>
          </EntityDetails>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
