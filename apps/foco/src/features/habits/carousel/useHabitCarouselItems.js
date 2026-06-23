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
  habitsPreferences = null,
}) {
  const pendingItems = useMemo(() => {
    if (habitsPreferences === null) return [];
    return getCarouselItemsForMode(mode, {
      rutinaHoy,
      sectionIconsMap,
      habits,
      currentTimeOfDay,
      habitsPreferences,
    });
  }, [mode, rutinaHoy, sectionIconsMap, habits, currentTimeOfDay, habitsPreferences]);

  const shouldUseInfiniteCarousel = mode === 'luego' && pendingItems.length > 8;
  const carouselItems = shouldUseInfiniteCarousel
    ? [...pendingItems, ...pendingItems, ...pendingItems]
    : pendingItems;

  return { pendingItems, carouselItems, shouldUseInfiniteCarousel };
}
