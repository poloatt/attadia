import { useMemo } from 'react';
import { getCarouselItemsForMode } from '@shared/utils/habitVisibilityEngine';

/**
 * Filtra items del carrusel según modo Ahora/Luego.
 * @param {'ahora'|'luego'} mode
 */
export default function useHabitCarouselItems(mode, {
  rutinaHoy,
  sectionIconsMap,
  habits,
  currentTimeOfDay,
}) {
  const pendingItems = useMemo(
    () => getCarouselItemsForMode(mode, {
      rutinaHoy,
      sectionIconsMap,
      habits,
      currentTimeOfDay,
    }),
    mode === 'ahora'
      ? [mode, rutinaHoy, sectionIconsMap, habits, currentTimeOfDay]
      : [mode, rutinaHoy, sectionIconsMap, habits],
  );

  const shouldUseInfiniteCarousel = mode === 'luego' && pendingItems.length > 8;
  const carouselItems = shouldUseInfiniteCarousel
    ? [...pendingItems, ...pendingItems, ...pendingItems]
    : pendingItems;

  return { pendingItems, carouselItems, shouldUseInfiniteCarousel };
}
