/** Iconos hub por sección de rutina (claves de menuIcons / DynamicIcon). */
export const RUTINA_SECTION_ICON_KEYS = {
  bodyCare: 'monitorHeart',
  nutricion: 'restaurant',
  ejercicio: 'fitnessCenter',
  cleaning: 'cleaningServices',
};

export function getRutinaSectionIconKey(section) {
  return RUTINA_SECTION_ICON_KEYS[section] || 'fitnessCenter';
}
