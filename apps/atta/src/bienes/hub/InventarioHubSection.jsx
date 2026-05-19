import React, { useMemo, useState } from 'react';
import { Box, ButtonBase, Collapse, Typography } from '@mui/material';
import { ExpandMoreOutlined, Inventory2Outlined } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAPI } from '@shared/hooks/useAPI';
import { isPathActive } from '@shared/navigation/appNavResolver';
import FinanzasHubSectionCard from '../../finanzas/FinanzasHubSectionCard';
import { hubExpandButtonSx } from '../../navigation/attaHubSectionStyles';
import { BIENES_HUB_PREVIEW_COUNT } from './bienesHubConstants';
import BienesHubRow, { BienesHubRowSkeleton } from './BienesHubRow';
import { getHabitacionPropiedadLabel, getPropiedadLabel, normalizeDocId } from './bienesHubUtils';

const PATH = '/propiedades/inventario/en-propiedades';

function getInventarioSecondary(item) {
  if (item.habitacion && typeof item.habitacion === 'object') {
    return getHabitacionPropiedadLabel({ propiedad: item.propiedad, habitacion: item.habitacion });
  }
  if (item.propiedad && typeof item.propiedad === 'object') {
    return getPropiedadLabel(item.propiedad);
  }
  return item.categoria || '';
}

export default function InventarioHubSection() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, PATH);
  const [expanded, setExpanded] = useState(false);

  const { data, loading } = useAPI('/api/inventarios', {
    enableCache: true,
    cacheDuration: 60000,
    params: { limit: 50 },
  });

  const items = useMemo(() => {
    const docs = data?.docs ?? (Array.isArray(data) ? data : []);
    return docs.map((item) => ({ ...item, id: normalizeDocId(item) }));
  }, [data]);

  const preview = items.slice(0, BIENES_HUB_PREVIEW_COUNT);
  const rest = items.slice(BIENES_HUB_PREVIEW_COUNT);
  const hasMore = rest.length > 0;

  return (
    <FinanzasHubSectionCard title="Inventario" iconKey="inventario" path={PATH} isActive={isActive}>
      {loading ? (
        <>
          <BienesHubRowSkeleton />
          <BienesHubRowSkeleton />
        </>
      ) : items.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.125 }}>
          Sin ítems
        </Typography>
      ) : (
        <>
          {preview.map((item) => (
            <BienesHubRow
              key={item.id}
              icon={<Inventory2Outlined sx={{ fontSize: 16, color: 'text.secondary' }} />}
              primary={item.nombre || 'Sin nombre'}
              secondary={getInventarioSecondary(item)}
              trailing={item.cantidad != null ? `× ${item.cantidad}` : ''}
              onClick={(e) => {
                e.stopPropagation();
                navigate(PATH);
              }}
            />
          ))}
          {hasMore && (
            <>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box>
                  {rest.map((item) => (
                    <BienesHubRow
                      key={item.id}
                      icon={<Inventory2Outlined sx={{ fontSize: 16, color: 'text.secondary' }} />}
                      primary={item.nombre || 'Sin nombre'}
                      secondary={getInventarioSecondary(item)}
                      trailing={item.cantidad != null ? `× ${item.cantidad}` : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(PATH);
                      }}
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
