import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

/**
 * @param {'allDone'|'noHabits'|'error'} variant
 */
export default function HabitCarouselEmptyState({
  variant = 'allDone',
  mode = 'ahora',
  onConfigure,
}) {
  if (variant === 'error') {
    return (
      <Box
        role="status"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 36,
          px: 1,
        }}
      >
        <Typography variant="caption" color="error">
          No se pudieron cargar los hábitos
        </Typography>
      </Box>
    );
  }

  if (variant === 'noHabits') {
    return (
      <Box
        role="status"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 36,
          gap: 0.5,
          px: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Configura tus hábitos para empezar
        </Typography>
        {onConfigure && (
          <Button
            size="small"
            startIcon={<SettingsOutlinedIcon fontSize="small" />}
            onClick={onConfigure}
            sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0 }}
          >
            Personalizar
          </Button>
        )}
      </Box>
    );
  }

  const message = mode === 'luego'
    ? 'No hay hábitos pendientes para más tarde'
    : '¡Todo al día!';

  return (
    <Box
      role="status"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 0.5,
        minHeight: 36,
        px: 1,
      }}
    >
      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
      <Typography variant="caption" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
