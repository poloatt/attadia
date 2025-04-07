import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Collapse,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  TaskAltOutlined as TaskIcon,
  AssignmentOutlined as ProjectIcon,
  ArchiveOutlined as ArchiveIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTimeOutlined as TimeIcon
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useLocation } from 'react-router-dom';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

export function Tiempo() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tareas: {
      pendientes: 0,
      total: 0,
      completadas: 0,
      enProgreso: 0
    },
    proyectos: {
      activos: 0,
      total: 0,
      completados: 0,
      enPausa: 0
    },
  });
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  useEffect(() => {
    setTitle('Tiempo');
    setActions([
      {
        component: (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              enqueueSnackbar('Función no implementada', { variant: 'info' });
            }}
            sx={{ borderRadius: 0 }}
          >
            Nueva Tarea
          </Button>
        ),
        onClick: () => {}
      }
    ]);
  }, [setTitle, setActions, enqueueSnackbar]);

  const fetchTasksAndProjects = useCallback(async () => {
    try {
      console.log('Obteniendo estadísticas de tareas y proyectos...');
      const [tareasRes, proyectosRes] = await Promise.all([
        clienteAxios.get('/api/tareas'),
        clienteAxios.get('/api/proyectos')
      ]);
      
      // Calcular estadísticas de tareas
      const tareasList = tareasRes.data.docs || [];
      const tareas = {
        pendientes: tareasList.filter(t => t.estado === 'PENDIENTE').length,
        enProgreso: tareasList.filter(t => t.estado === 'EN_PROGRESO').length,
        completadas: tareasList.filter(t => t.estado === 'COMPLETADA').length,
        total: tareasList.length
      };

      // Calcular estadísticas de proyectos
      const proyectosList = proyectosRes.data.docs || [];
      const proyectos = {
        activos: proyectosList.filter(p => p.estado === 'EN_PROGRESO').length,
        completados: proyectosList.filter(p => p.estado === 'COMPLETADO').length,
        enPausa: proyectosList.filter(p => p.estado === 'PENDIENTE').length,
        total: proyectosList.length
      };

      console.log('Estadísticas calculadas de tareas:', tareas);
      console.log('Estadísticas calculadas de proyectos:', proyectos);

      setStats(prevStats => ({
        ...prevStats,
        tareas,
        proyectos
      }));
    } catch (error) {
      console.error('Error al obtener estadísticas de tareas y proyectos:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar('Error al cargar estadísticas de tareas y proyectos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchTasksAndProjects();
    
    const interval = setInterval(fetchTasksAndProjects, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTasksAndProjects]);

  const TasksAndProjectsSection = () => {
    // Función auxiliar para formatear el texto de conteo
    const formatCountText = (count, type) => {
      if (count === 0) {
        return `Sin ${type}`;
      }
      return `${count} ${type}`;
    };

    // Calcular tareas activas (pendientes + en progreso)
    const tareasActivas = stats.tareas.pendientes + stats.tareas.enProgreso;

    return (
      <Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Métricas principales */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Tareas */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: 'text.secondary',
              }}
            >
              <TaskIcon sx={{ fontSize: 18, color: 'inherit' }} />
              <Typography variant="body2" color="inherit">
                {formatCountText(tareasActivas, 'tareas activas')}
              </Typography>
            </Box>

            {/* Proyectos */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: 'text.secondary',
              }}
            >
              <ProjectIcon sx={{ fontSize: 18, color: 'inherit' }} />
              <Typography variant="body2" color="inherit">
                {formatCountText(stats.proyectos.activos, 'proyectos activos')}
              </Typography>
            </Box>
          </Box>

          {/* Control de expansión */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              sx={{
                p: 0.5,
                transform: isProjectsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: 'text.secondary'
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Sección colapsable */}
        <Collapse in={isProjectsOpen}>
          <Box sx={{ 
            mt: 0.5,
            pt: 0.5,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 2
            }}>
              {/* Sección de Tareas */}
              <Box>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#f44336', fontSize: '8px' }}>●</span> Pendientes: {stats.tareas.pendientes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#2196f3', fontSize: '8px' }}>●</span> En Progreso: {stats.tareas.enProgreso}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#4caf50', fontSize: '8px' }}>●</span> Completadas: {stats.tareas.completadas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24,
                    fontWeight: 500,
                    mt: 0.5,
                    pt: 0.5,
                    borderTop: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <span style={{ color: '#757575', fontSize: '8px' }}>●</span> Total: {stats.tareas.total}
                  </Typography>
                </Box>
              </Box>

              {/* Sección de Proyectos */}
              <Box>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#2196f3', fontSize: '8px' }}>●</span> Activos: {stats.proyectos.activos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#ff9800', fontSize: '8px' }}>●</span> En Pausa: {stats.proyectos.enPausa}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#4caf50', fontSize: '8px' }}>●</span> Completados: {stats.proyectos.completados}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24,
                    fontWeight: 500,
                    mt: 0.5,
                    pt: 0.5,
                    borderTop: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <span style={{ color: '#757575', fontSize: '8px' }}>●</span> Total: {stats.proyectos.total}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      <EntityToolbar 
        title="Tiempo"
        icon={null}
        onAdd={() => enqueueSnackbar('Función no implementada', { variant: 'info' })}
        showBackButton={false}
        actions={
          <>
            <Tooltip title={showValues ? "Ocultar valores" : "Mostrar valores"}>
              <IconButton 
                onClick={toggleValuesVisibility}
                sx={{ color: 'white' }}
              >
                {showValues ? <HideValuesIcon /> : <ShowValuesIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => enqueueSnackbar('Función no implementada', { variant: 'info' })}
              sx={{ borderRadius: 0 }}
            >
              Nueva Tarea
            </Button>
          </>
        }
        navigationItems={[
          { 
            icon: <ProjectIcon sx={{ fontSize: 21.6 }} />, 
            label: 'Proyectos', 
            to: '/proyectos'
          },
          {
            icon: <TaskIcon sx={{ fontSize: 21.6 }} />,
            label: 'Tareas',
            to: '/tareas'
          },
          {
            icon: <ArchiveIcon sx={{ fontSize: 21.6 }} />,
            label: 'Archivo',
            to: '/archivo'
          }
        ]}
      />

      <Box 
        sx={{ 
          py: 2,
          height: 'calc(100vh - 190px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(0,0,0,0.3)',
          },
        }}
      >
        <Grid container spacing={2}>
          {/* Tasks and Projects Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <TasksAndProjectsSection />
            </Paper>
          </Grid>
          
          {/* Espacio para contenido adicional */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Gestión del Tiempo</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Este panel te permite ver y gestionar tus tareas y proyectos de manera eficiente.
                Utiliza las opciones de navegación para acceder a las vistas detalladas.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Tiempo; 