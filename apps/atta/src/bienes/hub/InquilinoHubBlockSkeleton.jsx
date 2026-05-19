import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { ContratoTileSkeleton } from './ContratosHubCarousel';

export default function InquilinoHubBlockSkeleton() {
  return (
    <Box sx={{ mb: 1.25 }}>
      <Skeleton height={28} sx={{ mb: 0.5, borderRadius: 1 }} />
      <Box sx={{ display: 'flex', gap: 0.625 }}>
        <ContratoTileSkeleton count={2} />
      </Box>
    </Box>
  );
}
