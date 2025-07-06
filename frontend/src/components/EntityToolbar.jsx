import React, { useState, useMemo } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Avatar,

  useTheme,
  useMediaQuery,
  Button,
  Typography
} from '@mui/material';
import { useUISettings } from '../context/UISettingsContext';
import { 
  AddOutlined,
  ArrowBackOutlined,
  ApartmentOutlined as BuildingIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CalendarMonth as DateIcon,
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  FolderOutlined as ProjectIcon,
  CurrencyExchangeOutlined as MoneyIcon,
  AllInboxOutlined as InventoryIcon,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as ContratosIcon,
  AccountBalanceOutlined as CuentasIcon,
  TaskOutlined as TaskIcon,
  MonitorWeightOutlined as WeightIcon,
  HealthAndSafety as HealthIcon,
  AutorenewOutlined
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import EntityForm from './EntityViews/EntityForm';
import PropiedadForm from './propiedades/PropiedadForm';
import clienteAxios from '../config/axios';
import { Link } from 'react-router-dom';

const EntityToolbar = ({ 
  onAdd,
  showAddButton = true,
  showBackButton = true,
  showDivider = true,
  navigationItems = [],
  entityName = '',
  additionalActions = [],
  icon,
  title,
  children,
  onBack,
  forceShow = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openForm, setOpenForm] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentPath = location.pathname.slice(1);
  const currentBase = '/' + location.pathname.split('/')[1];
  const { showEntityToolbarNavigation } = useUISettings();

  // Lista de rutas que deben volver al inicio
  const homeReturnRoutes = [
    'propiedades',
    'habitaciones',
    'contratos',
    'inquilinos',
    'inventario',
    'lab',
    'rutinas',
    'salud',
    'transacciones',
    'cuentas',
    'monedas',
    'dieta',
    'proyectos',
    'tareas'
  ];

  // El toolbar se muestra SOLO si está habilitado en configuración O si forceShow está activado
  const shouldShowToolbar = forceShow || showEntityToolbarNavigation;

  // Mapeo de rutas a íconos
  const routeIcons = {
    propiedades: BuildingIcon,
    habitaciones: BedIcon,
    contratos: ContratosIcon,
    inquilinos: PeopleIcon,
    inventario: InventoryIcon,
    lab: LabIcon,
    rutinas: DateIcon,
    salud: HealthIcon,
    transacciones: WalletIcon,
    cuentas: CuentasIcon,
    monedas: MoneyIcon,
    dieta: DietaIcon,
    proyectos: ProjectIcon,
    datacorporal: WeightIcon,
    tareas: TaskIcon,
    recurrente: AutorenewOutlined
  };

  // Mapeo de rutas a títulos
  const routeTitles = {
    propiedades: 'Propiedades',
    habitaciones: 'Habitaciones',
    contratos: 'Contratos',
    inquilinos: 'Inquilinos',
    inventario: 'Inventario',
    lab: 'Laboratorio',
    rutinas: 'Rutinas',
    salud: 'Salud',
    transacciones: 'Transacciones',
    cuentas: 'Cuentas',
    monedas: 'Monedas',
    dieta: 'Dieta',
    proyectos: 'Proyectos',
    datacorporal: 'Composición Corporal',
    tareas: 'Tareas',
    recurrente: 'Transacciones Recurrentes'
  };

  // Determinar si estamos en la página actual
  const isCurrentPage = (path) => {
    return location.pathname === path;
  };

  // Filtrar elementos de navegación para eliminar la página actual
  const filterNavigationItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    // Obtener ruta actual
    const currentPathFull = location.pathname;
    
    return items.filter(item => {
      // Normalizar la ruta del ítem (asegurarnos que comienza con /)
      const itemPath = item.to.startsWith('/') ? item.to : `/${item.to}`;
      
      // Verificar si se trata de la página de rutinas
      if (currentBase === '/rutinas' && itemPath === '/rutinas') {
        return false;
      }
      
      // Verificar si el item coincide con la página actual (para otras páginas que no sean rutinas)
      // 1. Ruta exacta (/rutinas === /rutinas)
      // 2. Ruta base (/rutinas === /rutinas/12345)
      // 3. Rutas especiales como tiempo
      const isCurrentRoute = 
        currentPathFull === itemPath || 
        (currentBase === itemPath && currentBase !== '/rutinas') ||
        (itemPath === '/tiempo' && currentBase === '/tiempo');
      
      return !isCurrentRoute;
    });
  };

  // Aplicar el filtro a los elementos de navegación
  const finalNavigationItems = useMemo(() => {
    return filterNavigationItems(navigationItems);
  }, [navigationItems, location.pathname, currentBase]);

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      navigate('/tiempo');
    }
  };

  // Obtener el ícono de la página actual
  const getCurrentPageIcon = () => {
    if (icon) return icon;
    const IconComponent = routeIcons[currentPath];
    return IconComponent ? <IconComponent /> : null;
  };

  // Obtener el título de la página actual
  const getCurrentPageTitle = () => {
    if (title) return title;
    return routeTitles[currentPath] || '';
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
      await clienteAxios.post(`/api/${currentPath}`, formData);
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
    // No renderizar formulario si el EntityToolbar está oculto
    if (!shouldShowToolbar) {
      return null;
    }

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
          display: shouldShowToolbar ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.default,
          padding: '2px 0',
          borderBottom: 'none',
          boxShadow: 'none',
          width: '100%',
        }}
      >
        <Box sx={{ px: 0, width: '100%' }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: 40,
            position: 'relative',
            gap: {
              xs: 0.5,
              sm: 1
            },
            mb: 0.5
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
                xs: 40,
                sm: 48
              }
            }}>
              {showBackButton && location.pathname !== '/' && (
                <Tooltip title="Volver">
                  <IconButton 
                    onClick={handleBack}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'text.primary',
                        bgcolor: 'action.hover',
                      },
                      borderRadius: '50%',
                    }}
                  >
                    <ArrowBackOutlined sx={{ fontSize: 21.6 }} />
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
              {shouldShowToolbar && finalNavigationItems.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {finalNavigationItems.slice(0, Math.ceil(finalNavigationItems.length / 2)).map((item, index) => (
                    <Tooltip
                      key={`left-nav-${item.to}-${index}`}
                      title={item.label}
                      placement="bottom"
                    >
                      <IconButton
                        component={Link}
                        to={item.to}
                        size="small"
                        sx={{
                          p: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: location.pathname === item.to ? 'action.selected' : 'transparent',
                          color: location.pathname === item.to ? 'primary.main' : 'text.secondary',
                          '&:hover': {
                            bgcolor: location.pathname === item.to ? 'action.selected' : 'action.hover',
                          }
                        }}
                      >
                        {item.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}

              {/* Ícono y título de la página actual */}
              {getCurrentPageIcon() && currentBase !== '/rutinas' && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                  mx: 1,
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.selected',
                    borderRadius: '50%',
                    width: 38,
                    height: 38,
                  }}>
                    {React.cloneElement(getCurrentPageIcon(), { 
                      sx: { fontSize: 24 }
                    })}
                  </Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      display: { xs: 'none', sm: 'block' },
                      whiteSpace: 'nowrap',
                      color: 'primary.main'
                    }}
                  >
                    {getCurrentPageTitle()}
                  </Typography>
                </Box>
              )}

              {/* Íconos de navegación a la derecha */}
              {shouldShowToolbar && finalNavigationItems.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {finalNavigationItems.slice(Math.ceil(finalNavigationItems.length / 2)).map((item, index) => (
                    <Tooltip
                      key={`right-nav-${item.to}-${index}`}
                      title={item.label}
                      placement="bottom"
                    >
                      <IconButton
                        component={Link}
                        to={item.to}
                        size="small"
                        sx={{
                          p: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: location.pathname === item.to ? 'action.selected' : 'transparent',
                          color: location.pathname === item.to ? 'primary.main' : 'text.secondary',
                          '&:hover': {
                            bgcolor: location.pathname === item.to ? 'action.selected' : 'action.hover',
                          }
                        }}
                      >
                        {item.icon}
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
                xs: 40,
                sm: 48
              }
            }}>
              {children}
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
                      borderRadius: 19.2,
                    }}
                  >
                    {action.label}
                  </Button>
                </Tooltip>
              ))}

              {/* Botón de agregar si está habilitado y no estamos en contratos */}
              {showAddButton && currentPath !== 'contratos' && (
                <Tooltip title={`Agregar ${entityConfig.name || ''}`}>
                  <IconButton
                    onClick={handleAdd}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      borderRadius: '50%',
                      width: 38,
                      height: 38,
                      '&:hover': { 
                        color: 'text.primary',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <AddOutlined sx={{ fontSize: 21.6 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {renderForm()}
    </>
  );
};

export default EntityToolbar;