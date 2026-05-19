import { useAttaSectionStats } from '../navigation/useAttaSectionStats';
import { BIENES_STATS_ENDPOINTS } from './bienesStatsEndpoints';

/** @deprecated Usar useAttaSectionStats(BIENES_STATS_ENDPOINTS) */
export function useBienesSectionStats() {
  return useAttaSectionStats(BIENES_STATS_ENDPOINTS);
}
