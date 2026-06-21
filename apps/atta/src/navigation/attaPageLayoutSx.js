/** Contenedor estándar de páginas Atta (hub y subpáginas). */
export const attaPageLayoutSx = {
  width: '100%',
  maxWidth: 900,
  mx: 'auto',
  px: { xs: 1, sm: 2, md: 3 },
  py: 2,
  pb: {
    xs: 'calc(80px + env(safe-area-inset-bottom, 0px))',
    sm: 4,
  },
  boxSizing: 'border-box',
};
