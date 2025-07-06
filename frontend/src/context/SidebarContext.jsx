import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  PaidOutlined,
  AccountBalanceWalletOutlined,
  CurrencyExchangeOutlined,
  AttachMoneyOutlined,
  RepeatOutlined,
  PersonSearchOutlined,
  ApartmentOutlined,
  PersonOutlined,
  DescriptionOutlined,
  HotelOutlined,
  AllInboxOutlined,
  HealthAndSafetyOutlined,
  MonitorHeartOutlined,
  ScienceOutlined,
  RestaurantOutlined,
  AccessTimeOutlined,
  FolderOutlined,
  TaskOutlined,
  ArchiveOutlined,
  SettingsOutlined,
  ManageAccountsOutlined,
  AccountCircleOutlined,
  AccountBalanceOutlined,
  TrendingUpOutlined
} from '@mui/icons-material';

const SidebarContext = createContext();

const menuItems = [
  {
    id: 'assets',
    title: 'Assets',
    icon: <TrendingUpOutlined />,
    path: '/dashboard', // Ruta principal para Assets
    hasSubItems: true,
    subItems: [
      {
        title: 'Transacciones',
        path: '/transacciones',
        icon: <AccountBalanceWalletOutlined />
      },
      {
        title: 'Cuentas',
        path: '/cuentas',
        icon: <AccountBalanceOutlined />
      },
      {
        title: 'Monedas',
        path: '/monedas',
        icon: <CurrencyExchangeOutlined />
      },
      {
        title: 'Recurrente',
        path: '/recurrente',
        icon: <RepeatOutlined />
      },
      {
        title: 'Deudores',
        path: '/deudores',
        icon: <PersonSearchOutlined />
      }
    ]
  },
  {
    id: 'propiedades',
    title: 'Propiedades',
    icon: <ApartmentOutlined />,
    path: '/propiedades',
    hasSubItems: true,
    subItems: [
      {
        title: 'Inquilinos',
        path: '/inquilinos',
        icon: <PersonOutlined />
      },
      {
        title: 'Contratos',
        path: '/contratos',
        icon: <DescriptionOutlined />
      },
      {
        title: 'Habitaciones',
        path: '/habitaciones',
        icon: <HotelOutlined />
      }
    ]
  },
  {
    id: 'rutinas',
    title: 'Rutinas',
    icon: <HealthAndSafetyOutlined />,
    path: '/rutinas', // Ruta principal para Rutinas
    hasSubItems: true,
    subItems: [
      {
        title: 'Salud',
        path: '/salud',
        icon: <MonitorHeartOutlined />
      },
      {
        title: 'Lab',
        path: '/lab',
        icon: <ScienceOutlined />
      },
      {
        title: 'Dieta',
        path: '/dieta',
        icon: <RestaurantOutlined />
      }
    ]
  },
  {
    id: 'time',
    title: 'Time',
    icon: <AccessTimeOutlined />,
    path: '/tiempo', // Ruta principal para Time
    hasSubItems: true,
    subItems: [
      {
        title: 'Proyectos',
        path: '/proyectos',
        icon: <FolderOutlined />
      },
      {
        title: 'Tareas',
        path: '/tareas',
        icon: <TaskOutlined />
      },
      {
        title: 'Archivo',
        path: '/archivo',
        icon: <ArchiveOutlined />
      }
    ]
  },
  {
    id: 'setup',
    title: 'Setup',
    icon: <SettingsOutlined />,
    path: '/configuracion', // Ruta principal para Setup
    hasSubItems: true,
    subItems: [
  {
    title: 'Perfil',
    path: '/perfil',
        icon: <AccountCircleOutlined />
      },
      {
        title: 'Preferencias',
        path: '/preferencias',
        icon: <ManageAccountsOutlined />
      }
    ]
  }
];

export function SidebarProvider({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  
  // Inicializar isOpen basado en el tamaño de pantalla
  const [isOpen, setIsOpen] = useState(isDesktop);
  const [expandedSections, setExpandedSections] = useState(new Set()); // Todas las secciones colapsadas por defecto

  // Efecto para ajustar la sidebar cuando cambie el tamaño de pantalla
  useEffect(() => {
    if (isDesktop) {
      // En desktop, abrir por defecto si no está explícitamente cerrada
      const userPreference = localStorage.getItem('sidebarDesktopOpen');
      if (userPreference === null) {
        setIsOpen(true);
      } else {
        setIsOpen(userPreference === 'true');
      }
    } else {
      // En móvil, mantener colapsada por defecto pero visible
      const userPreference = localStorage.getItem('sidebarMobileOpen');
      if (userPreference === null) {
        setIsOpen(false); // Colapsada por defecto
      } else {
        setIsOpen(userPreference === 'true');
      }
    }
  }, [isDesktop]);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Guardar preferencia del usuario para desktop y móvil
    if (isDesktop) {
      localStorage.setItem('sidebarDesktopOpen', newState.toString());
    } else {
      localStorage.setItem('sidebarMobileOpen', newState.toString());
    }
  };

  const closeSidebar = () => {
    setIsOpen(false);
    if (isDesktop) {
      localStorage.setItem('sidebarDesktopOpen', 'false');
    } else {
      localStorage.setItem('sidebarMobileOpen', 'false');
    }
  };

  const openSidebar = () => {
    setIsOpen(true);
    if (isDesktop) {
      localStorage.setItem('sidebarDesktopOpen', 'true');
    } else {
      localStorage.setItem('sidebarMobileOpen', 'true');
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionExpanded = (sectionId) => {
    return expandedSections.has(sectionId);
  };

  const expandSection = (sectionId) => {
    if (isDesktop) {
      setExpandedSections(new Set([sectionId])); // Solo una expandida en desktop
    } else {
      setExpandedSections(prev => new Set([...prev, sectionId])); // Comportamiento actual en móvil
    }
  };

  const collapseSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      toggleSidebar,
      closeSidebar,
      openSidebar,
      menuItems,
      expandedSections,
      toggleSection,
      isSectionExpanded,
      expandSection,
      collapseSection,
      isDesktop
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 