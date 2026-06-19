import React, { memo } from 'react';
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';
import { Close as CloseIcon, GetApp as GetAppIcon } from '@mui/icons-material';
import { useAppConfig } from '../../hooks/useAppDetection';
import usePwaInstall from '../../hooks/usePwaInstall';
import useResponsive from '../../hooks/useResponsive';

/**
 * Banner discreto para instalar la PWA actual en el escritorio (Chrome/Edge).
 * Solo visible en desktop cuando beforeinstallprompt está disponible.
 */
function PwaInstallBanner() {
  const { isDesktop } = useResponsive();
  const { appTitle } = useAppConfig();
  const { canInstall, promptInstall, dismiss } = usePwaInstall();

  if (!isDesktop || !canInstall) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 56,
        right: 24,
        zIndex: 1500,
        maxWidth: 360,
        p: 2,
        pr: 5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <IconButton
        size="small"
        onClick={dismiss}
        aria-label="Cerrar"
        sx={{ position: 'absolute', top: 4, right: 4 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <GetAppIcon sx={{ color: 'primary.main', mt: 0.25 }} />
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Instalar {appTitle} en el escritorio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Accede más rápido desde la barra de tareas, como una app nativa.
          </Typography>
          <Button size="small" variant="contained" onClick={promptInstall}>
            Instalar
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default memo(PwaInstallBanner);
