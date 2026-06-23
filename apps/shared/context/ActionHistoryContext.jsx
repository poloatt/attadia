import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { migrateLegacyActions, normalizeUndoEntity } from '../config/undoScopeConfig';
import { isUndoRecordingSuppressed } from '../undo/undoSuppress';
import { ACTION_TYPES, ENTITY_TYPES } from '../constants/actionHistoryTypes';

export { ACTION_TYPES, ENTITY_TYPES };

const ActionHistoryContext = createContext();

function normalizeStoredAction(action) {
  return migrateLegacyActions([action])[0];
}

export function ActionHistoryProvider({ children }) {
  const [actionHistory, setActionHistory] = useState([]);
  const [maxHistorySize] = useState(50);
  const storageKey = (() => {
    try {
      const appName = typeof window !== 'undefined' && window && window.APP_CONFIG && window.APP_CONFIG.name
        ? window.APP_CONFIG.name
        : 'app';
      return `${appName}:actionHistory`;
    } catch (_) {
      return 'app:actionHistory';
    }
  })();

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setActionHistory(parsed.map(normalizeStoredAction));
        }
      }
    } catch (error) {
      console.warn('Error loading action history from localStorage:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(actionHistory));
    } catch (error) {
      console.warn('Error saving action history to localStorage:', error);
    }
  }, [actionHistory, storageKey]);

  const addAction = useCallback((action) => {
    if (isUndoRecordingSuppressed()) return null;

    const actionWithTimestamp = {
      ...action,
      entity: normalizeUndoEntity(action.entity),
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    };

    setActionHistory(prev => {
      const newHistory = [actionWithTimestamp, ...prev];
      return newHistory.slice(0, maxHistorySize);
    });

    return actionWithTimestamp.id;
  }, [maxHistorySize]);

  const undoLastAction = useCallback(() => {
    if (actionHistory.length === 0) return null;

    const lastAction = actionHistory[0];
    setActionHistory(prev => prev.slice(1));
    return lastAction;
  }, [actionHistory]);

  const undoLastForScope = useCallback((scope) => {
    if (!scope) return null;

    const index = actionHistory.findIndex(action => action.scope === scope);
    if (index === -1) return null;

    const actionToUndo = actionHistory[index];
    setActionHistory(prev => prev.filter((_, i) => i !== index));
    return actionToUndo;
  }, [actionHistory]);

  const undoActionById = useCallback((actionId) => {
    let removed = null;
    setActionHistory(prev => {
      const actionIndex = prev.findIndex(action => action.id === actionId);
      if (actionIndex === -1) return prev;

      removed = prev[actionIndex];
      return prev.filter((_, index) => index !== actionIndex);
    });
    return removed;
  }, []);

  const clearHistory = useCallback(() => {
    setActionHistory([]);
  }, []);

  const getUndoCount = useCallback(() => {
    return actionHistory.length;
  }, [actionHistory]);

  const getUndoCountForScope = useCallback((scope) => {
    if (!scope) return 0;
    return actionHistory.filter(action => action.scope === scope).length;
  }, [actionHistory]);

  const canUndo = useCallback(() => {
    return actionHistory.length > 0;
  }, [actionHistory]);

  const canUndoForScope = useCallback((scope) => {
    if (!scope) return false;
    return actionHistory.some(action => action.scope === scope);
  }, [actionHistory]);

  const getActionsByEntity = useCallback((entityType) => {
    const normalized = normalizeUndoEntity(entityType);
    return actionHistory.filter(action => action.entity === normalized);
  }, [actionHistory]);

  const getActionsByType = useCallback((actionType) => {
    return actionHistory.filter(action => action.type === actionType);
  }, [actionHistory]);

  const getActionsForScope = useCallback((scope, count = 5) => {
    if (!scope) return [];
    return actionHistory.filter(action => action.scope === scope).slice(0, count);
  }, [actionHistory]);

  const getLastActions = useCallback((count = 5) => {
    return actionHistory.slice(0, count);
  }, [actionHistory]);

  return (
    <ActionHistoryContext.Provider
      value={{
        actionHistory,
        addAction,
        undoLastAction,
        undoLastForScope,
        undoActionById,
        clearHistory,
        getUndoCount,
        getUndoCountForScope,
        canUndo,
        canUndoForScope,
        getActionsByEntity,
        getActionsByType,
        getActionsForScope,
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
