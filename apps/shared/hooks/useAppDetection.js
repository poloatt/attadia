import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { bottomNavigationItems } from '../navigation/menuStructure.js';

// Mapeo de paths a apps
const APP_PATH_MAPPING = {
  '/assets': 'atta',
  '/salud': 'pulso', 
  '/tiempo': 'foco',
  '/configuracion': 'foco' // Fallback a foco para configuración
};

// Mapeo de puertos a apps
const PORT_APP_MAPPING = {
  '5173': 'foco',
  '5174': 'atta',
  '5175': 'pulso'
};

export const useAppDetection = () => {
  const location = useLocation();
  
  const appInfo = useMemo(() => {
    // Detectar por puerto
    const currentPort = window.location.port;
    const appByPort = PORT_APP_MAPPING[currentPort];
    
    // Detectar por path
    const pathname = location.pathname;
    const appByPath = Object.keys(APP_PATH_MAPPING).find(path => 
      pathname.startsWith(path)
    );
    const appName = APP_PATH_MAPPING[appByPath] || appByPort || 'foco';
    
    // Obtener información de la app
    const appConfig = bottomNavigationItems.find(item => item.id === appName);
    
    return {
      appName,
      appTitle: appConfig?.title || 'Foco',
      appIcon: appConfig?.icon || 'accessTime',
      appPath: appConfig?.path || '/tiempo/rutinas',
      currentPort,
      detectedBy: appByPort ? 'port' : 'path'
    };
  }, [location.pathname]);
  
  return appInfo;
};

// Hook específico para obtener solo el nombre de la app
export const useCurrentApp = () => {
  const { appName } = useAppDetection();
  return appName;
};

// Hook para obtener configuración completa
export const useAppConfig = () => {
  const appInfo = useAppDetection();
  return appInfo;
};
