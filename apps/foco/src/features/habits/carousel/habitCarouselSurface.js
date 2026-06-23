import { alpha } from '@mui/material/styles';

/** Tokens de superficie compartidos entre carrusel y panel desktop de rutinas. */
export function getHabitCarouselSurface(theme, { dense = true } = {}) {
  const surfaceBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.035)
    : alpha(theme.palette.common.black, 0.03);
  const dividerColor = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.10)
    : alpha(theme.palette.common.black, 0.10);
  const hoverBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.055)
    : alpha(theme.palette.common.black, 0.045);

  return {
    size: dense ? 32 : 36,
    bg: surfaceBg,
    hoverBg,
    rail: dividerColor,
    surfaceBg,
    dividerColor,
  };
}
