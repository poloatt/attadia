// Utils para obtener inquilinos por propiedad, contrato, etc.

/**
 * Obtiene los inquilinos asociados a una propiedad.
 * @param {Object} propiedad - Objeto de propiedad que puede tener un array de inquilinos o contratos.
 * @returns {Array} Array de inquilinos únicos.
 */
export function getInquilinosByPropiedad(propiedad) {
  if (!propiedad) return [];
  // Si la propiedad tiene un array directo de inquilinos
  if (Array.isArray(propiedad.inquilinos) && propiedad.inquilinos.length > 0) {
    return propiedad.inquilinos;
  }
  // Si la propiedad tiene contratos, buscar inquilinos en los contratos
  if (Array.isArray(propiedad.contratos)) {
    const inquilinos = propiedad.contratos.flatMap(c => {
      // El inquilino puede ser un array o un objeto individual
      if (Array.isArray(c.inquilino)) {
        return c.inquilino;
      } else if (c.inquilino && typeof c.inquilino === 'object') {
        return [c.inquilino];
      }
      return [];
    }).filter(Boolean);
    
    // Eliminar duplicados por _id
    const unique = [];
    const ids = new Set();
    for (const inq of inquilinos) {
      if (inq && inq._id && !ids.has(inq._id)) {
        unique.push(inq);
        ids.add(inq._id);
      }
    }
    return unique;
  }
  return [];
}

/**
 * Obtiene los inquilinos asociados a un contrato.
 * @param {Object} contrato - Objeto de contrato que puede tener un array de inquilinos.
 * @returns {Array} Array de inquilinos.
 */
export function getInquilinosByContrato(contrato) {
  if (!contrato) return [];
  if (Array.isArray(contrato.inquilino)) {
    return contrato.inquilino;
  }
  return [];
} 