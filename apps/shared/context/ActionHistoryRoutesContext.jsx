import React, { createContext, useContext, useMemo } from 'react';

// Estructura esperada del mapa: {
//   '/ruta/base': { entity: 'tarea', apiService: { create, update, delete, getById } }
// }
const ActionHistoryRoutesContext = createContext(null);

export function ActionHistoryRoutesProvider({ routesMap, children }) {
  const value = useMemo(() => ({ routesMap: routesMap || {} }), [routesMap]);
  return (
    <ActionHistoryRoutesContext.Provider value={value}>
      {children}
    </ActionHistoryRoutesContext.Provider>
  );
}

export function useActionHistoryRoutes() {
  const context = useContext(ActionHistoryRoutesContext);
  // No arrojamos error para mantener compatibilidad cuando no se provee el provider
  return context || { routesMap: {} };
}


