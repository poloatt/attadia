import React, { useState, useEffect, useMemo } from 'react';
import { useRutinas } from './context/RutinasContext.jsx';
import { useRutinasStatistics } from './context/RutinasStatisticsContext.jsx';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  LinearProgress,
  Divider,
  Grid,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Favorite as FavoriteIcon,
  FitnessCenter as FitnessCenterIcon,
  Restaurant as RestaurantIcon,
  CleaningServices as CleaningIcon
} from '@mui/icons-material';

const RutinaStats = () => {
  // Acceder al contexto principal de rutinas
  const { rutina } = useRutinas();
  
  // Acceder al contexto de estadísticas
  const { 
    calculateCompletionPercentage, 
    calculateSectionStats,
    calculateHistoricalStats
  } = useRutinasStatistics();
  
  // Estado para el período de estadísticas históricas
  const [historicalPeriod, setHistoricalPeriod] = useState(7); // 7 días por defecto
  
  // Calcular estadísticas por sección (pero no mostramos el porcentaje general)
  const sectionStats = useMemo(() => {
    if (!rutina) return null;
    return calculateSectionStats(rutina);
  }, [rutina, calculateSectionStats]);
  
  // Calcular estadísticas históricas
  const historicalStats = useMemo(() => {
    return calculateHistoricalStats(historicalPeriod);
  }, [historicalPeriod, calculateHistoricalStats]);
  
  // Manejar cambio de período
  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setHistoricalPeriod(newPeriod);
    }
  };
  
  // Renderizar indicador de tendencia
  const renderTrendIcon = (tendencia) => {
    switch(tendencia) {
      case 'mejorando':
        return <TrendingUpIcon color="success" />;
      case 'empeorando':
        return <TrendingDownIcon color="error" />;
      default:
        return <TrendingFlatIcon color="info" />;
    }
  };
  
  // Mapeo de iconos para secciones
  const sectionIcons = {
    bodyCare: <FavoriteIcon color="secondary" fontSize="small" />,
    ejercicio: <FitnessCenterIcon color="primary" fontSize="small" />,
    nutricion: <RestaurantIcon color="success" fontSize="small" />,
    cleaning: <CleaningIcon color="info" fontSize="small" />
  };
  
  // Mapeo de nombres de secciones
  const sectionNames = {
    bodyCare: 'Cuidado Personal',
    ejercicio: 'Ejercicio',
    nutricion: 'Nutrición',
    cleaning: 'Limpieza'
  };
  
  if (!rutina) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardHeader title="Estadísticas" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No hay rutina seleccionada
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Box sx={{ mb: 3 }}>
      {/* Secciones con barras minimalistas */}
      <Card sx={{ mb: 2 }}>
        <CardHeader 
          title="Progreso por Sección" 
          subheader={new Date(rutina.fecha).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        />
        <CardContent>
          {sectionStats && (
            <Stack spacing={2.5}>
              {Object.keys(sectionStats).map(section => (
                <Box key={section} sx={{ width: '100%', position: 'relative' }}>
                  {/* Barra minimalista en la parte superior */}
                  <LinearProgress 
                    variant="determinate" 
                    value={sectionStats[section].percentage} 
                    color={sectionStats[section].percentage > 75 ? "success" : sectionStats[section].percentage > 40 ? "info" : "warning"}
                    sx={{ 
                      height: 3, 
                      borderRadius: 0,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0
                    }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    pt: 1 // Padding top para dar espacio a la barra
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sectionIcons[section]}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {sectionNames[section]}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {`${sectionStats[section].completed}/${sectionStats[section].visible}`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
      
      {/* Estadísticas históricas */}
      <Card>
        <CardHeader 
          title="Estadísticas Históricas" 
          action={
            <ToggleButtonGroup
              value={historicalPeriod}
              exclusive
              onChange={handlePeriodChange}
              size="small"
            >
              <ToggleButton value={7}>7 días</ToggleButton>
              <ToggleButton value={14}>14 días</ToggleButton>
              <ToggleButton value={30}>30 días</ToggleButton>
            </ToggleButtonGroup>
          }
        />
        <CardContent>
          {historicalStats.totalRutinas > 0 ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Rutinas registradas:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {historicalStats.totalRutinas}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Promedio de completitud:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                    {`${historicalStats.promedioCompletitud}%`}
                  </Typography>
                  {renderTrendIcon(historicalStats.tendencia)}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip 
                  label={`Mejor día: ${historicalStats.mejorDia?.completitud}%`}
                  color="success"
                  size="small"
                  icon={<TrendingUpIcon />}
                />
                <Chip 
                  label={`Peor día: ${historicalStats.peorDia?.completitud}%`}
                  color="error"
                  size="small"
                  icon={<TrendingDownIcon />}
                />
              </Stack>
              
              <Typography variant="caption" color="text.secondary">
                Los datos históricos te ayudan a visualizar tu progreso y rendimiento a lo largo del tiempo.
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay datos históricos suficientes para este período. Completa más días de rutinas para ver estadísticas.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RutinaStats; 
