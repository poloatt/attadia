import React from 'react';
import { Container, Grid } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ApartmentOutlined as BuildingIcon,
  MonetizationOnOutlined as MoneyIcon,
  CalendarTodayOutlined as DailyIcon,
  AssignmentOutlined as ProjectIcon
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
            icon: <MoneyIcon sx={{ fontSize: 20 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          },
          {
            icon: <BuildingIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <DailyIcon sx={{ fontSize: 20 }} />,
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

      {/* Assets Section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityDetails title="Assets">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <EntityDetails title="Propiedades">
                  {/* Resumen de propiedades */}
                </EntityDetails>
              </Grid>
              <Grid item xs={12} md={6}>
                <EntityDetails title="Transacciones">
                  {/* Resumen de transacciones */}
                </EntityDetails>
              </Grid>
            </Grid>
          </EntityDetails>
        </Grid>

        {/* Daylist Section */}
        <Grid item xs={12}>
          <EntityDetails title="Daylist">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <EntityDetails title="Tareas Pendientes">
                  {/* Lista de tareas del día */}
                </EntityDetails>
              </Grid>
              <Grid item xs={12} md={6}>
                <EntityDetails title="Rutinas">
                  {/* Rutinas programadas */}
                </EntityDetails>
              </Grid>
            </Grid>
          </EntityDetails>
        </Grid>

        {/* Projects Section */}
        <Grid item xs={12}>
          <EntityDetails title="Projects">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <EntityDetails title="Proyectos Activos">
                  {/* Lista de proyectos activos */}
                </EntityDetails>
              </Grid>
              <Grid item xs={12} md={6}>
                <EntityDetails title="Lab">
                  {/* Experimentos en curso */}
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
