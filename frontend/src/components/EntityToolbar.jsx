import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Container,
  useTheme,
  useMediaQuery,
  Button
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
  TaskAltOutlined as TaskIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  MonitorWeightOutlined as WeightIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import EntityForm from './EntityViews/EntityForm';
import PropiedadForm from './propiedades/PropiedadForm';
import clienteAxios from '../config/axios';

const EntityToolbar = ({ 
  onAdd,
  showAddButton = true,
  showBackButton = true,
  showDivider = true,
  navigationItems = [],
  entityName = '',
  additionalActions = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openForm, setOpenForm] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentPath = location.pathname.slice(1);

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
    'dieta',
    'proyectos',
    'tareas'
  ];

  // Mapeo de rutas a íconos
  const routeIcons = {
    propiedades: BuildingIcon,
    habitaciones: BedIcon,
    contratos: ContratosIcon,
    inquilinos: PeopleIcon,
    inventario: InventoryIcon,
    lab: LabIcon,
    rutinas: RutinasIcon,
    transacciones: WalletIcon,
    cuentas: CuentasIcon,
    monedas: MoneyIcon,
    dieta: DietaIcon,
    proyectos: ProjectIcon,
    datacorporal: WeightIcon,
    tareas: TaskIcon
  };

  // Determinar si estamos en la página de Rutinas
  const isRutinasPage = location.pathname === '/rutinas';

  // Si estamos en la página de Rutinas, agregar el botón de DataCorporal
  const finalNavigationItems = isRutinasPage ? [
    ...navigationItems,
    {
      icon: <WeightIcon sx={{ fontSize: 20 }} />,
      label: 'Composición Corporal',
      to: '/datacorporal'
    }
  ] : navigationItems;

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
      await clienteAxios.post(`/${currentPath}`, formData);
      setOpenForm(false);
      
      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('entityUpdated', {
        detail: { type: currentPath, action: 'create' }
      }));
      
      // Mostrar notificación de éxito
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Éxito', {
          body: 'Registro creado exitosamente'
        });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      // Aquí podrías mostrar un mensaje de error
    }
  };

  const entityConfig = getEntityConfig();

  const renderForm = () => {
    if (currentPath === 'propiedades') {
      return (
        <PropiedadForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSubmit={handleSubmit}
          initialData={{}}
          isEditing={false}
        />
      );
    }

    return (
      <EntityForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        title={`Nuevo ${entityConfig.name}`}
        fields={entityConfig.fields}
      />
    );
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.default,
          padding: '8px 16px',
          borderBottom: 'none',
          boxShadow: 'none',
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
            height: 48,
            position: 'relative',
            gap: {
              xs: 1,
              sm: 2
            },
            mb: 2
          }}>
            {/* Sección izquierda */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: {
                xs: 1,
                sm: 2
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
            </Box>

            {/* Sección central */}
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
              {/* Íconos de navegación a la izquierda */}
              {finalNavigationItems.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {finalNavigationItems.slice(0, Math.ceil(finalNavigationItems.length / 2)).map((item) => (
                    <Tooltip key={item.to} title={item.label}>
                      <IconButton
                        onClick={() => navigate(item.to)}
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' }
                        }}
                      >
                        {React.cloneElement(item.icon, { fontSize: 'small' })}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}

              {/* Ícono de la página actual */}
              {getCurrentPageIcon() && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'text.primary',
                  mx: 1 // Margen horizontal para separación
                }}>
                  {React.cloneElement(getCurrentPageIcon(), { fontSize: 'small' })}
                </Box>
              )}

              {/* Íconos de navegación a la derecha */}
              {finalNavigationItems.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {finalNavigationItems.slice(Math.ceil(finalNavigationItems.length / 2)).map((item) => (
                    <Tooltip key={item.to} title={item.label}>
                      <IconButton
                        onClick={() => navigate(item.to)}
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' }
                        }}
                      >
                        {React.cloneElement(item.icon, { fontSize: 'small' })}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}
            </Box>

            {/* Sección derecha */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: {
                xs: 0.5,
                sm: 1
              },
              justifyContent: 'flex-end',
              minWidth: {
                xs: 48,
                sm: 72
              }
            }}>
              {/* Botones adicionales */}
              {additionalActions?.map((action, index) => (
                <Tooltip key={index} title={action.tooltip || action.label}>
                  <Button
                    onClick={action.onClick}
                    size="small"
                    variant="outlined"
                    color={action.color || 'primary'}
                    sx={{
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      fontSize: '0.75rem',
                      borderRadius: 1
                    }}
                  >
                    {action.label}
                  </Button>
                </Tooltip>
              ))}

              {/* Botón de agregar si está habilitado */}
              {showAddButton && (
                <Tooltip title={`Agregar ${entityConfig.name || ''}`}>
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
            </Box>
          </Box>
        </Container>
      </Box>

      {renderForm()}
    </>
  );
};

export default EntityToolbar;