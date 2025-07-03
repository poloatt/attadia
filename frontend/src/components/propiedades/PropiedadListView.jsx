import React from 'react';
import {
  Box,
  Typography,
  Collapse
} from '@mui/material';
import { Link } from 'react-router-dom';

// Función para determinar el estado del contrato
const getEstadoContrato = (contrato) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  
  if (inicio <= hoy && fin >= hoy) {
    return 'ACTIVO';
  } else if (inicio > hoy) {
    return contrato.estado === 'RESERVADO' ? 'RESERVADO' : 'PLANEADO';
  } else if (fin < hoy) {
    return 'FINALIZADO';
  }
  return contrato.estado || 'PENDIENTE';
};

// Función para obtener el color del estado del inquilino
const getInquilinoStatusColor = (estado) => {
  const statusColors = {
    'ACTIVO': '#4caf50',
    'RESERVADO': '#ff9800',
    'PENDIENTE': '#2196f3',
    'INACTIVO': '#9e9e9e'
  };
  return statusColors[estado] || '#9e9e9e';
};

// Función para pluralizar
const pluralizar = (cantidad, singular, plural) => cantidad === 1 ? singular : plural;

// Componente para mostrar inquilinos en lista
const InquilinosList = ({ inquilinos, inquilinosActivos, inquilinosFinalizados }) => {
  return (
    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {inquilinosActivos.length === 0 && <Typography variant="body2" color="text.secondary">Ninguno</Typography>}
      {inquilinosActivos.map(i => (
        <Typography key={i._id} variant="body2">{i.nombre} {i.apellido}</Typography>
      ))}
      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        {inquilinosFinalizados.length} {pluralizar(inquilinosFinalizados.length, 'inquilino finalizado', 'inquilinos finalizados')}
      </Typography>
      {inquilinosFinalizados.length === 0 && <Typography variant="body2" color="text.secondary">Ninguno</Typography>}
      {inquilinosFinalizados.map(i => (
        <Typography key={i._id} variant="body2">{i.nombre} {i.apellido} ({i.estado})</Typography>
      ))}
    </Box>
  );
};

// Componente para mostrar contratos en lista
const ContratosList = ({ contratosActivos }) => {
  return (
    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {contratosActivos
        .sort((a, b) => {
          const estadoA = getEstadoContrato(a);
          const estadoB = getEstadoContrato(b);
          const orden = {
            'ACTIVO': 0,
            'RESERVADO': 1,
            'PLANEADO': 2,
            'FINALIZADO': 3
          };
          return orden[estadoA] - orden[estadoB];
        })
        .map(contrato => {
          const estado = getEstadoContrato(contrato);
          return (
            <Box 
              key={contrato._id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                justifyContent: 'space-between'
              }}
            >
              <Typography 
                component={Link}
                to={`/contratos/${contrato._id}`}
                variant="body2" 
                sx={{ 
                  fontSize: '0.8rem',
                  color: getInquilinoStatusColor(estado),
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    backgroundColor: getInquilinoStatusColor(estado)
                  }} 
                />
                {contrato.tipoContrato === 'MANTENIMIENTO' ? 'Contrato de mantenimiento' : 'Contrato de alquiler'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  color: getInquilinoStatusColor(estado)
                }}
              >
                {estado}
              </Typography>
            </Box>
          );
        })}
    </Box>
  );
};

// Componente para mostrar habitaciones en lista
const HabitacionesList = ({ habitacionesAgrupadas, totalHabitaciones, getNombreTipoHabitacion }) => {
  return (
    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {Object.entries(habitacionesAgrupadas).map(([tipo, habitaciones]) => (
        <Typography key={tipo} variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {habitaciones.length} {getNombreTipoHabitacion(tipo)}
          {habitaciones.length > 1 && 's'}
        </Typography>
      ))}
      {totalHabitaciones === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No hay habitaciones registradas
        </Typography>
      )}
    </Box>
  );
};

// Componente para mostrar inventario en lista
const InventarioList = ({ inventario }) => {
  if (!inventario || inventario.length === 0) {
    return (
      <Box sx={{ pl: 2, pt: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No hay elementos en el inventario
        </Typography>
      </Box>
    );
  }

  // Agrupar inventario por categoría
  const inventarioAgrupado = inventario.reduce((acc, item) => {
    const categoria = item.categoria || 'Sin categoría';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {Object.entries(inventarioAgrupado).map(([categoria, items]) => (
        <Box key={categoria}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {categoria} ({items.length})
          </Typography>
          {items.map((item) => (
            <Typography key={item._id} variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', pl: 1 }}>
              {item.nombre} - Cantidad: {item.cantidad || 1}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Componente principal PropiedadListView
const PropiedadListView = ({ 
  type, 
  data,
  // Props adicionales necesarios para ciertos tipos
  inquilinosActivos = [],
  inquilinosFinalizados = [],
  contratosActivos = [],
  habitacionesAgrupadas = {},
  totalHabitaciones = 0,
  getNombreTipoHabitacion = () => ''
}) => {
  const renderContent = () => {
    switch (type) {
      case 'inquilinos':
        return (
          <InquilinosList 
            inquilinos={data}
            inquilinosActivos={inquilinosActivos}
            inquilinosFinalizados={inquilinosFinalizados}
          />
        );
      case 'contratos':
        return <ContratosList contratosActivos={contratosActivos} />;
      case 'habitaciones':
        return (
          <HabitacionesList 
            habitacionesAgrupadas={habitacionesAgrupadas}
            totalHabitaciones={totalHabitaciones}
            getNombreTipoHabitacion={getNombreTipoHabitacion}
          />
        );
      case 'inventario':
        return <InventarioList inventario={data} />;
      default:
        return (
          <Box sx={{ pl: 2, pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Tipo de vista no reconocido
            </Typography>
          </Box>
        );
    }
  };

  return renderContent();
};

export default PropiedadListView; 