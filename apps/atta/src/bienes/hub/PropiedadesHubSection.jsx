import React, { useMemo, useState } from 'react';
import { Box, ButtonBase, Collapse, Skeleton, Typography } from '@mui/material';
import { ExpandMoreOutlined } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useAPI } from '@shared/hooks/useAPI';
import { isPathActive } from '@shared/navigation/appNavResolver';
import FinanzasHubSectionCard from '../../finanzas/FinanzasHubSectionCard';
import MonedasCarousel from '../../finance/monedas/MonedasCarousel';
import { hubExpandButtonSx } from '../../navigation/attaHubSectionStyles';
import { HabitacionTileSkeleton } from './HabitacionTile';
import PropiedadHubBlock from './PropiedadHubBlock';
import { BIENES_HUB_PROPIEDAD_PREVIEW_COUNT } from './bienesHubConstants';
import { normalizeDocId } from './bienesHubUtils';

const PATH = '/propiedades';

function PropiedadesHubSkeleton() {
  return (
    <Box>
      <Skeleton height={36} animation="wave" sx={{ borderRadius: 1.5, bgcolor: 'action.hover', mb: 1 }} />
      <MonedasCarousel>
        <HabitacionTileSkeleton />
        <HabitacionTileSkeleton />
        <HabitacionTileSkeleton />
      </MonedasCarousel>
    </Box>
  );
}

export default function PropiedadesHubSection() {
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, PATH);
  const [expanded, setExpanded] = useState(false);

  const { data, loading } = useAPI('/api/propiedades', {
    enableCache: true,
    cacheDuration: 60000,
    params: { withRelated: 'true', limit: 50 },
  });

  const propiedades = useMemo(() => {
    const docs = data?.docs ?? (Array.isArray(data) ? data : []);
    return docs.map((p) => ({
      ...p,
      id: normalizeDocId(p),
      habitaciones: (p.habitaciones || []).map((h) => ({ ...h, id: normalizeDocId(h) })),
    }));
  }, [data]);

  const preview = propiedades.slice(0, BIENES_HUB_PROPIEDAD_PREVIEW_COUNT);
  const rest = propiedades.slice(BIENES_HUB_PROPIEDAD_PREVIEW_COUNT);
  const hasMore = rest.length > 0;

  return (
    <FinanzasHubSectionCard title="Propiedades" iconKey="apartment" path={PATH} isActive={isActive}>
      {loading ? (
        <PropiedadesHubSkeleton />
      ) : propiedades.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', px: 0.25 }}>
          Sin propiedades
        </Typography>
      ) : (
        <>
          {preview.map((propiedad, index) => (
            <PropiedadHubBlock
              key={propiedad.id}
              propiedad={propiedad}
              isLast={!hasMore && index === preview.length - 1}
            />
          ))}
          {hasMore && (
            <>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box>
                  {rest.map((propiedad, index) => (
                    <PropiedadHubBlock
                      key={propiedad.id}
                      propiedad={propiedad}
                      isLast={index === rest.length - 1}
                    />
                  ))}
                </Box>
              </Collapse>
              <ButtonBase onClick={() => setExpanded((v) => !v)} sx={hubExpandButtonSx}>
                <ExpandMoreOutlined
                  sx={{
                    fontSize: 16,
                    transition: 'transform 0.2s',
                    transform: expanded ? 'rotate(180deg)' : 'none',
                  }}
                />
                <span>{expanded ? 'Ver menos' : `Ver ${rest.length} más`}</span>
              </ButtonBase>
            </>
          )}
        </>
      )}
    </FinanzasHubSectionCard>
  );
}
