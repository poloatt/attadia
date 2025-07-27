import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '4px',
      background: `linear-gradient(135deg, ${color}15 0%, #FFFFFF 100%)`,
    }}
  >
    <Box>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" component="div" sx={{ fontWeight: 600, color }}>
        {value}
      </Typography>
    </Box>
    <Box
      sx={{
        backgroundColor: `${color}25`,
        borderRadius: '8px',
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
  </Paper>
);

const ProyectosStats = ({ proyectos }) => {
  const stats = {
    pendientes: proyectos.filter(p => p.estado === 'PENDIENTE').length,
    enProgreso: proyectos.filter(p => p.estado === 'EN_PROGRESO').length,
    completados: proyectos.filter(p => p.estado === 'COMPLETADO').length,
    atrasados: proyectos.filter(p => {
      if (!p.fechaFin) return false;
      return new Date(p.fechaFin) < new Date() && p.estado !== 'COMPLETADO';
    }).length,
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="En Progreso"
          value={stats.enProgreso}
          icon={<TrendingUpIcon sx={{ color: '#4CAF50' }} />}
          color="#4CAF50"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pendientes"
          value={stats.pendientes}
          icon={<PauseIcon sx={{ color: '#FFC107' }} />}
          color="#FFC107"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Completados"
          value={stats.completados}
          icon={<CheckCircleIcon sx={{ color: '#2196F3' }} />}
          color="#2196F3"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Atrasados"
          value={stats.atrasados}
          icon={<WarningIcon sx={{ color: '#F44336' }} />}
          color="#F44336"
        />
      </Grid>
    </Grid>
  );
};

export default ProyectosStats; 
