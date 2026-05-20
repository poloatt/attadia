import React from 'react';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import { ChevronRightOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DynamicIcon } from '@shared/components/common/DynamicIcon';
import {
  getAttaHubSectionCardSx,
  attaHubSectionBodySx,
  attaHubSectionHeaderSx,
} from './styles/attaHubSectionStyles';
import { hubHeaderIconSx } from './styles/attaHubChipStyles';

/** Shell compartido: cabecera + preview en hubs Atta (Finanzas, Propiedades, Inventario). */
export default function AttaHubSectionCard({
  title,
  iconKey,
  path,
  isActive,
  children,
  cardSx,
  headerSx,
  bodySx,
}) {
  const navigate = useNavigate();

  return (
    <Card elevation={0} sx={{ ...getAttaHubSectionCardSx(isActive), ...cardSx }}>
      <CardActionArea onClick={() => navigate(path)} sx={{ ...attaHubSectionHeaderSx, ...headerSx }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <DynamicIcon iconKey={iconKey} size="small" sx={hubHeaderIconSx} />
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
            {title}
          </Typography>
          <ChevronRightOutlined
            sx={{ fontSize: 20, color: isActive ? 'primary.main' : 'text.disabled' }}
          />
        </Box>
      </CardActionArea>

      <Box
        sx={{ ...attaHubSectionBodySx, ...bodySx }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Card>
  );
}
