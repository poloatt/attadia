import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useUISettings } from '../context/UISettingsContext';
import { useSidebar } from '../context/SidebarContext';
import useResponsive from '../hooks/useResponsive';
import { AGENDA_UNIFIED_BAR_CONFIG, HEADER_CONFIG } from '../config/uiConstants';

/**
 * Fila título + acciones bajo AgendaUnifiedBar.
 * Consume NavigationBarContext (setTitle / setActions de las páginas).
 */
export default function EntityNavigationBar() {
  const { title, actions } = useNavigationBar();
  const { showSidebarCollapsed } = useUISettings();
  const { getMainMargin } = useSidebar();
  const { isMobileOrTablet } = useResponsive();

  if (!title && actions.length === 0) return null;

  const mainMargin = getMainMargin(isMobileOrTablet, showSidebarCollapsed);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: AGENDA_UNIFIED_BAR_CONFIG.height,
        left: mainMargin,
        right: 0,
        height: HEADER_CONFIG.height,
        zIndex: HEADER_CONFIG.zIndex - 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.5, sm: 2, md: 3 },
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'left 0.3s',
      }}
    >
      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, minWidth: 0 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {actions.map((action, index) => (
          <Box key={action.key || index}>{action.component}</Box>
        ))}
      </Box>
    </Box>
  );
}
