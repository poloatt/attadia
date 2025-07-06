import React, { createContext, useContext, useState, useCallback } from 'react';

const ActionHistoryContext = createContext();

export function ActionHistoryProvider({ children }) {
  const [actionHistory, setActionHistory] = useState([]);
  const [maxHistorySize] = useState(50); // Máximo 50 acciones en el historial

  // Agregar una acción al historial
  const addAction = useCallback((action) => {
    setActionHistory(prev => {
      const newHistory = [action, ...prev];
      // Mantener solo las últimas maxHistorySize acciones
      return newHistory.slice(0, maxHistorySize);
    });
  }, [maxHistorySize]);

  // Revertir la última acción
  const undoLastAction = useCallback(() => {
    if (actionHistory.length === 0) return null;
    
    const lastAction = actionHistory[0];
    setActionHistory(prev => prev.slice(1));
    return lastAction;
  }, [actionHistory]);

  // Limpiar el historial
  const clearHistory = useCallback(() => {
    setActionHistory([]);
  }, []);

  // Obtener el número de acciones disponibles para revertir
  const getUndoCount = useCallback(() => {
    return actionHistory.length;
  }, [actionHistory]);

  // Verificar si hay acciones para revertir
  const canUndo = useCallback(() => {
    return actionHistory.length > 0;
  }, [actionHistory]);

  return (
    <ActionHistoryContext.Provider
      value={{
        actionHistory,
        addAction,
        undoLastAction,
        clearHistory,
        getUndoCount,
        canUndo
      }}
    >
      {children}
    </ActionHistoryContext.Provider>
  );
}

export function useActionHistory() {
  const context = useContext(ActionHistoryContext);
  if (!context) {
    throw new Error('useActionHistory must be used within an ActionHistoryProvider');
  }
  return context;
} 