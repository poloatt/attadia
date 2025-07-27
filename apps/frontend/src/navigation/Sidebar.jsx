import React, { useEffect, useMemo, useCallback } from 'react';
import { 
  Drawer, 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton, 
  Divider,
  Tooltip,
  IconButton,
  Typography,
  useTheme,
  // No uso useMediaQuery aquí, solo el contexto
  Collapse,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useUISettings } from '../context/UISettingsContext';
import { icons } from './menuIcons';
import SidebarResizer from './SidebarResizer';
import theme from '../context/ThemeContext';

export default function Sidebar({ moduloActivo }) {
  const theme = useTheme();
  const {
    isOpen,
    isDesktop,
    sidebarWidth,
    closeSidebar,
    selectedMain,
    setSelectedMain,
    selectedSecond,
    setSelectedSecond,
    handleSidebarResize,
    getChildPadding
  } = useSidebar();
  const { showEntityToolbarNavigation } = useUISettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Si no hay módulo activo, no renderizar nada
  if (!moduloActivo) return null;

  // SubItems del módulo activo (nivel 1)
  const nivel1 = moduloActivo.subItems || [];

  // Renderizar subItems de nivel 1 y sus hijos (nivel 2)
  const renderNivel1 = () => (
    <List disablePadding>
      {nivel1.map(item => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        const hasChildren = item.subItems && item.subItems.length > 0;
        return (
          <React.Fragment key={item.id}>
            <ListItem disablePadding sx={{ bgcolor: 'transparent' }}>
              <ListItemButton
                onClick={() => {
                  if (item.path && !item.isUnderConstruction) {
                    navigate(item.path);
                  }
                  setSelectedSecond(item.id);
                }}
                selected={isActive}
                disabled={item.isUnderConstruction}
                sx={{
                  minHeight: 36,
                  pl: isOpen ? 2 : 0,
                  pr: isOpen ? 1.5 : 0,
                  borderRadius: '12px',
                  mb: 0.25,
                  justifyContent: isOpen ? 'initial' : 'center',
                  backgroundColor: isActive ? '#323232' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? '#3a3a3a' : '#232323',
                  },
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: '#323232',
                    color: '#fff',
                  },
                  opacity: item.isUnderConstruction ? 0.5 : 1,
                  transition: 'background 0.2s',
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: isOpen ? 'auto' : '100%',
                    mx: isOpen ? 0 : 'auto',
                  }}
                >
                  {typeof item.icon === 'string' && icons[item.icon] &&
                    React.createElement(icons[item.icon], { fontSize: 'small' })}
                </ListItemIcon>
                {isOpen && <ListItemText primary={item.title} />}
              </ListItemButton>
            </ListItem>
            {/* Collapse para hijos de nivel 2 */}
            {hasChildren && (
              <Collapse in={selectedSecond === item.id && isOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map(child => (
                    <ListItem key={child.id} disablePadding sx={{ bgcolor: 'transparent' }}>
                      <ListItemButton
                        onClick={() => {
                          if (child.path && !child.isUnderConstruction) {
                            navigate(child.path);
                          }
                        }}
                        selected={location.pathname === child.path}
                        disabled={child.isUnderConstruction}
                                                 sx={{
                           minHeight: 32,
                           pl: getChildPadding(isOpen), // Padding modular y centralizado para elementos child
                           pr: isOpen ? 1.5 : 1,
                          borderRadius: '12px',
                          mb: 0.15,
                          backgroundColor: location.pathname === child.path ? '#232323' : 'transparent',
                          '&:hover': {
                            backgroundColor: '#232323',
                          },
                          opacity: child.isUnderConstruction ? 0.5 : 1,
                          transition: 'background 0.2s',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: isOpen ? 'auto' : '100%',
                            mx: isOpen ? 0 : 'auto',
                          }}
                        >
                          {typeof child.icon === 'string' && icons[child.icon] &&
                            React.createElement(icons[child.icon], { fontSize: 'small' })}
                        </ListItemIcon>
                        {isOpen && <ListItemText primary={child.title} />}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        );
      })}
    </List>
  );

  return (
    <Box sx={{
      width: isOpen ? sidebarWidth : 56,
      transition: 'width 0.3s ease',
      flexShrink: 0,
      pb: { xs: '88px', sm: '88px', md: 0 },
      backgroundColor: 'background.default',
      height: '100%',
      borderRight: '1.5px solid #232323',
      position: 'relative',
      zIndex: 1100,
    }}>
      <Drawer
        variant="permanent"
        sx={{
          width: isOpen ? sidebarWidth : 56,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            position: 'relative',
            left: 0,
            top: 0,
            width: isOpen ? sidebarWidth : 56,
            minWidth: 56,
            maxWidth: 400,
            borderRadius: 0,
            borderRight: '1.5px solid #232323',
            backgroundColor: 'background.default',
            height: '100%',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
            zIndex: 1100,
            pb: { xs: '88px', sm: '88px', md: 0 },
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#232323', borderRadius: 0 },
          }
        }}
      >
        {/* Renderizar navegación de nivel 1 y 2 */}
        {renderNivel1()}
        {/* Sidebar Resizer y otros elementos si es necesario */}
        <SidebarResizer 
          onResize={handleSidebarResize}
          isOpen={isOpen}
          isDesktop={isDesktop}
          minWidth={200}
          maxWidth={400}
          defaultWidth={sidebarWidth}
        />
      </Drawer>
    </Box>
  );
}
