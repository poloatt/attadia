import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  AddOutlined,
  ArrowBackOutlined,
  ApartmentOutlined as BuildingIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  FitnessCenterOutlined as RutinasIcon,
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  AssignmentOutlined as ProjectIcon,
  CurrencyExchangeOutlined as MoneyIcon,
  Inventory2Outlined as InventoryIcon,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as ContratosIcon,
  AccountBalanceOutlined as CuentasIcon,
  TaskAltOutlined,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import EntityForm from './EntityViews/EntityForm';
import axios from 'axios';

const EntityToolbar = ({ 
  onAdd,
  showAddButton = true,
  showBackButton = true,
  showDivider = true,
  navigationItems = [],
  entityName = '',
  showValues,
  onToggleValues,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openForm, setOpenForm] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Lista de rutas que deben volver al inicio
  const homeReturnRoutes = [
    'propiedades',
    'habitaciones',
    'contratos',
    'inquilinos',
    'inventario',
    'lab',
    'rutinas',
    'transacciones',
    'cuentas',
    'monedas',
    'dieta'
  ];

  // Mapeo de rutas a íconos
  const routeIcons = {
    propiedades: BuildingIcon,
    habitaciones: BedIcon,
    contratos: ContratosIcon,
    inquilinos: PeopleIcon,
    inventario: InventoryIcon,
    lab: LabIcon,
    rutinas: TaskAltOutlined,
    transacciones: WalletIcon,
    cuentas: CuentasIcon,
    monedas: MoneyIcon,
    dieta: DietaIcon,
    proyectos: ProjectIcon
  };

  const handleBack = () => {
    const currentPath = location.pathname.slice(1);
    if (homeReturnRoutes.includes(currentPath)) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  // Obtener el ícono de la página actual
  const getCurrentPageIcon = () => {
    const currentPath = location.pathname.slice(1);
    const IconComponent = routeIcons[currentPath];
    return IconComponent ? <IconComponent /> : null;
  };

  // Determinar el tipo de entidad basado en la ruta
  const getEntityConfig = () => {
    const path = location.pathname.slice(1); // Elimina el / inicial
    
    const configs = {
      proyectos: {
        name: 'proyecto',
        fields: [
          { name: 'titulo', label: 'Título', type: 'text', required: true },
          { name: 'descripcion', label: 'Descripción', type: 'textarea' },
          { name: 'estado', label: 'Estado', type: 'select', 
            options: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'] },
          { name: 'tags', label: 'Etiquetas', type: 'creatable-select', multi: true }
        ]
      },
      propiedades: {
        name: 'propiedad',
        fields: [
          { name: 'nombre', label: 'Nombre', type: 'text', required: true },
          { name: 'direccion', label: 'Dirección', type: 'text', required: true },
          { name: 'tipo', label: 'Tipo', type: 'select',
            options: ['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL'] }
        ]
      },
      transacciones: {
        name: 'transacción',
        fields: [
          { name: 'descripcion', label: 'Descripción', type: 'text', required: true },
          { name: 'monto', label: 'Monto', type: 'number', required: true },
          { name: 'tipo', label: 'Tipo', type: 'select',
            options: ['INGRESO', 'EGRESO'] },
          { name: 'categoria', label: 'Categoría', type: 'creatable-select' }
        ]
      },
      rutinas: {
        name: 'rutina',
        fields: [
          { name: 'nombre', label: 'Nombre', type: 'text', required: true },
          { name: 'descripcion', label: 'Descripción', type: 'textarea' },
          { name: 'frecuencia', label: 'Frecuencia', type: 'select',
            options: ['DIARIA', 'SEMANAL', 'MENSUAL'] }
        ]
      }
    };

    return configs[path] || { name: entityName, fields: [] };
  };

  const handleAdd = () => {
    if (typeof onAdd === 'function') {
      onAdd();
    } else {
      setOpenForm(true);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const path = location.pathname.slice(1);
      await axios.post(`/api/${path}`, formData);
      setOpenForm(false);
      // Aquí podrías disparar un evento para actualizar la lista
    } catch (error) {
      console.error('Error al guardar:', error);
      // Aquí podrías mostrar un mensaje de error
    }
  };

  const entityConfig = getEntityConfig();

  return (
    <Box
      sx={{
        width: '100%',
        height: 40,
        borderBottom: showDivider ? '1px solid' : 'none',
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}
    >
      <Container 
        maxWidth="lg" 
        disableGutters
        sx={{
          px: {
            xs: 1,
            sm: 2,
            md: 3
          }
        }}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: 40,
          position: 'relative',
          gap: {
            xs: 0.5,
            sm: 1
          }
        }}>
          {/* Sección izquierda */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: {
              xs: 0.5,
              sm: 1
            },
            width: {
              xs: 48,
              sm: 72
            }
          }}>
            {showBackButton && location.pathname !== '/' && (
              <Tooltip title="Volver">
                <IconButton 
                  onClick={handleBack}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' }
                  }}
                >
                  <ArrowBackOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {getCurrentPageIcon() && location.pathname !== '/' && (
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary'
                }}
                disabled
              >
                {React.cloneElement(getCurrentPageIcon(), { 
                  sx: { fontSize: 18 } 
                })}
              </IconButton>
            )}
          </Box>

          {/* Sección central - Eliminado el Divider */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: {
              xs: 0.5,
              sm: 1
            },
            justifyContent: 'center',
            flex: 1,
            overflow: 'auto'
          }}>
            {navigationItems.map((item) => (
              <Tooltip key={item.to} title={item.label}>
                <IconButton
                  onClick={() => navigate(item.to)}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' }
                  }}
                >
                  {React.cloneElement(item.icon, { 
                    sx: { fontSize: 18 } 
                  })}
                </IconButton>
              </Tooltip>
            ))}
          </Box>

          {/* Sección derecha */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: {
              xs: 0.5,
              sm: 1
            },
            width: {
              xs: 48,
              sm: 72
            }
          }}>
            {showAddButton && (
              <Tooltip title={`Agregar ${entityName}`}>
                <IconButton 
                  onClick={handleAdd}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' }
                  }}
                >
                  <AddOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {/* Botón mostrar/ocultar valores */}
            <IconButton 
              size="small" 
              onClick={onToggleValues}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' }
              }}
            >
              {showValues ? <ShowValuesIcon /> : <HideValuesIcon />}
            </IconButton>
          </Box>
        </Box>
      </Container>

      {/* Form Modal */}
      {openForm && (
        <EntityForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSubmit={handleSubmit}
          title={`Nuevo ${entityConfig.name}`}
          fields={entityConfig.fields}
        />
      )}
    </Box>
  );
};

export default EntityToolbar;