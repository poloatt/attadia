/** Agrupa dependencias comunes para mejor cache entre deploys y apps hermanas. */
export function createAppManualChunks(id) {
  const normalized = id.split('\\').join('/');
  if (
    normalized.includes('/node_modules/react/')
    || normalized.includes('/node_modules/react-dom/')
    || normalized.includes('/node_modules/react-router-dom/')
  ) {
    return 'vendor';
  }
  if (normalized.includes('/node_modules/@mui/')) {
    return 'mui';
  }
  if (
    normalized.includes('/node_modules/axios/')
    || normalized.includes('/node_modules/date-fns/')
    || normalized.includes('/node_modules/notistack/')
  ) {
    return 'utils';
  }
  if (normalized.includes('/apps/shared/')) {
    return 'shared';
  }
}
