import React, { useMemo } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getEstadoText } from '@shared/components/common/StatusSystem';
import { HubSectionShell } from '@shared/components/hub';
import { hubSectionSeeMoreSx } from '@shared/styles/hubSectionStyles';
import focoConfig from '../../config/app';

const PREVIEW_COUNT = 3;
const OBJETIVOS_PATH = focoConfig.routes.objetivos;

function getObjetivoLabel(objetivo) {
  return objetivo?.nombre || objetivo?.titulo || 'Sin nombre';
}

export default function ObjetivosPreviewSection({ objetivos = [] }) {
  const navigate = useNavigate();
  const goToObjetivos = () => navigate(OBJETIVOS_PATH);

  const preview = useMemo(() => objetivos.slice(0, PREVIEW_COUNT), [objetivos]);
  const hasMore = objetivos.length > PREVIEW_COUNT;

  return (
    <HubSectionShell
      title="Objetivos"
      onTitleClick={goToObjetivos}
      shellSx={{ mt: 1.5 }}
      bodySx={{ py: 1.25 }}
    >
      {preview.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', px: 0.25 }}>
          Sin objetivos
        </Typography>
      ) : (
        <>
          {preview.map((objetivo, index) => (
            <Box
              key={objetivo._id || objetivo.id || index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.75,
                ...(index < preview.length - 1 || hasMore
                  ? { borderBottom: 1, borderColor: 'divider' }
                  : {}),
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                  {getObjetivoLabel(objetivo)}
                </Typography>
                {objetivo.estado ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {getEstadoText(objetivo.estado, 'OBJETIVO')}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          ))}
          {hasMore ? (
            <ButtonBase onClick={goToObjetivos} sx={hubSectionSeeMoreSx}>
              Ver más
            </ButtonBase>
          ) : null}
        </>
      )}
    </HubSectionShell>
  );
}
