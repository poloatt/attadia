import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ActionHistoryContext = createContext();

// Tipos de acciones soportadas
export const ACTION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MOVE: 'MOVE',
  BULK_DELETE: 'BULK_DELETE',
  BULK_UPDATE: 'BULK_UPDATE'
};

// Entidades soportadas
export const ENTITY_TYPES = {
  PROYECTO: 'proyecto',
  TAREA: 'tarea',
  PROPIEDAD: 'propiedad',
  TRANSACCION: 'transaccion',
  CUENTA: 'cuenta',
  MONEDA: 'moneda',
  RUTINA: 'rutina',
  INQUILINO: 'inquilino',
  CONTRATO: 'contrato',
  HABITACION: 'habitacion',
  INVENTARIO: 'inventario',
  TRANSACCION_RECURRENTE: 'transaccion_recurrente'
};

export function ActionHistoryProvider({ children }) {
  const [actionHistory, setActionHistory] = useState([]);
  const [maxHistorySize] = useState(50); // Máximo 50 acciones en el historial

  // Cargar historial desde localStorage al inicializar
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('actionHistory');
      console.log('ActionHistoryContext - Loading from localStorage:', savedHistory);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        console.log('ActionHistoryContext - Parsed history:', parsed);
        setActionHistory(parsed);
      }
    } catch (error) {
      console.warn('Error loading action history from localStorage:', error);
    }
  }, []);

  // Guardar historial en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('actionHistory', JSON.stringify(actionHistory));
    } catch (error) {
      console.warn('Error saving action history to localStorage:', error);
    }
  }, [actionHistory]);

  // Agregar una acción al historial
  const addAction = useCallback((action) => {
    const actionWithTimestamp = {
      ...action,
      id: Date.now() + Math.random(), // ID único
      timestamp: new Date().toISOString(),
      createdAt: Date.now()
    };

    console.log('ActionHistoryContext - Adding action:', actionWithTimestamp);

    setActionHistory(prev => {
      const newHistory = [actionWithTimestamp, ...prev];
      // Mantener solo las últimas maxHistorySize acciones
      const result = newHistory.slice(0, maxHistorySize);
      console.log('ActionHistoryContext - New history:', result);
      return result;
    });

    return actionWithTimestamp.id;
  }, [maxHistorySize]);

  // Revertir la última acción
  const undoLastAction = useCallback(() => {
    if (actionHistory.length === 0) return null;
    
    const lastAction = actionHistory[0];
    setActionHistory(prev => prev.slice(1));
    return lastAction;
  }, [actionHistory]);

  // Revertir una acción específica por ID
  const undoActionById = useCallback((actionId) => {
    setActionHistory(prev => {
      const actionIndex = prev.findIndex(action => action.id === actionId);
      if (actionIndex === -1) return prev;
      
      const actionToUndo = prev[actionIndex];
      const newHistory = prev.filter((_, index) => index !== actionIndex);
      return newHistory;
    });
  }, []);

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

  // Obtener acciones por tipo de entidad
  const getActionsByEntity = useCallback((entityType) => {
    return actionHistory.filter(action => action.entity === entityType);
  }, [actionHistory]);

  // Obtener acciones por tipo de acción
  const getActionsByType = useCallback((actionType) => {
    return actionHistory.filter(action => action.type === actionType);
  }, [actionHistory]);

  // Obtener las últimas N acciones
  const getLastActions = useCallback((count = 5) => {
    return actionHistory.slice(0, count);
  }, [actionHistory]);

  return (
    <ActionHistoryContext.Provider
      value={{
        actionHistory,
        addAction,
        undoLastAction,
        undoActionById,
        clearHistory,
        getUndoCount,
        canUndo,
        getActionsByEntity,
        getActionsByType,
        getLastActions,
        ACTION_TYPES,
        ENTITY_TYPES
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