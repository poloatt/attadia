import React, { useMemo, useState } from 'react';
import { Box, ButtonBase, Collapse, Link, Typography } from '@mui/material';
import { ExpandMoreOutlined, OpenInNewOutlined, PersonOutline } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAPI } from '@shared/hooks/useAPI';
import { isPathActive } from '@shared/navigation/appNavResolver';
import FinanzasHubSectionCard from '../../finanzas/FinanzasHubSectionCard';
import { hubExpandButtonSx } from '../../navigation/attaHubSectionStyles';
import { BIENES_HUB_PREVIEW_COUNT } from './bienesHubConstants';
import BienesHubRow, { BienesHubRowSkeleton } from './BienesHubRow';
import {
  countContratosForInquilino,
  getInquilinoNombre,
  normalizeDocId,
} from './bienesHubUtils';

const INQUILINOS_PATH = '/propiedades/inquilinos';
const CONTRATOS_PATH = '/propiedades/contratos';

function formatContratosLabel(count) {
  if (count === 0) return 'Sin contratos';
  if (count === 1) return '1 contrato';
  return `${count} contratos`;
}

export default function InquilinosHubSection() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, INQUILINOS_PATH);
  const [expanded, setExpanded] = useState(false);

  const { data: inquilinosData, loading: loadingInquilinos } = useAPI('/api/inquilinos', {
    enableCache: true,
    cacheDuration: 60000,
    params: { limit: 100 },
  });

  const { data: contratosData, loading: loadingContratos } = useAPI('/api/contratos', {
    enableCache: true,
    cacheDuration: 60000,
    params: { limit: 300 },
  });

  const loading = loadingInquilinos || loadingContratos;

  const inquilinos = useMemo(() => {
    const docs = inquilinosData?.docs ?? (Array.isArray(inquilinosData) ? inquilinosData : []);
    const contratos = contratosData?.docs ?? (Array.isArray(contratosData) ? contratosData : []);
    return docs.map((i) => {
      const id = normalizeDocId(i);
      const contratosCount = countContratosForInquilino(id, contratos);
      return { ...i, id, contratosCount };
    });
  }, [inquilinosData, contratosData]);

  const preview = inquilinos.slice(0, BIENES_HUB_PREVIEW_COUNT);
  const rest = inquilinos.slice(BIENES_HUB_PREVIEW_COUNT);
  const hasMore = rest.length > 0;

  const renderInquilino = (inquilino) => {
    const { contratosCount } = inquilino;

    return (
      <BienesHubRow
          key={inquilino.id}
          icon={<PersonOutline sx={{ fontSize: 16, color: 'text.secondary' }} />}
          primary={getInquilinoNombre(inquilino)}
          secondary={
            contratosCount > 0 ? (
              <Link
                component="button"
                variant="caption"
                underline="hover"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(CONTRATOS_PATH);
                }}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  color: 'primary.main',
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  p: 0,
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                Ver contratos
                <OpenInNewOutlined sx={{ fontSize: 12 }} />
              </Link>
            ) : (
              inquilino.email
            )
          }
          trailing={formatContratosLabel(contratosCount)}
          trailingColor={contratosCount > 0 ? 'primary.main' : 'text.secondary'}
          onClick={(e) => {
            e.stopPropagation();
            navigate(INQUILINOS_PATH);
          }}
        />
    );
  };

  return (
    <FinanzasHubSectionCard title="Inquilinos" iconKey="person" path={INQUILINOS_PATH} isActive={isActive}>
      {loading ? (
        <>
          <BienesHubRowSkeleton />
          <BienesHubRowSkeleton />
        </>
      ) : inquilinos.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.125 }}>
          Sin inquilinos
        </Typography>
      ) : (
        <>
          {preview.map(renderInquilino)}
          {hasMore && (
            <>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box>{rest.map(renderInquilino)}</Box>
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
