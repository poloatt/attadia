import { useState, useCallback } from 'react';

export const useContratoExpansion = (contratos = []) => {
  const [expandedContratos, setExpandedContratos] = useState({});

  const toggleExpansion = useCallback((contratoId) => {
    setExpandedContratos(prev => {
      const newExpanded = {};
      // Solo una expandida a la vez
      Object.keys(prev).forEach(id => {
        newExpanded[id] = id === contratoId ? !prev[id] : false;
      });
      return newExpanded;
    });
  }, []);

  const isExpanded = useCallback((contratoId) => {
    return expandedContratos[contratoId] || false;
  }, [expandedContratos]);

  const expandAll = useCallback(() => {
    const allExpanded = {};
    contratos.forEach(contrato => {
      allExpanded[contrato._id || contrato.id] = true;
    });
    setExpandedContratos(allExpanded);
  }, [contratos]);

  const collapseAll = useCallback(() => {
    setExpandedContratos({});
  }, []);

  return {
    expandedContratos,
    toggleExpansion,
    isExpanded,
    expandAll,
    collapseAll
  };
}; 