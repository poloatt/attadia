export const getHealth = async () => {
  // Retornar directamente el objeto de estado
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
}; 