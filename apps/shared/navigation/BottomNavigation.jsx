import React, { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { NAV_TYPO } from '../config/uiConstants';
import { useLocation, Link } from 'react-router-dom';
import { resolveBottomNavItems, isAttaBranchActive, isPathActive } from './appNavResolver';
import { DynamicIcon } from '../components/common/DynamicIcon';
import useResponsive from '../hooks/useResponsive';

/**
 * Navegación inferior móvil.
 * Atta: sin ramas en bottom nav (hub Finanzas único).
 * Foco/Pulso: secciones planas del módulo.
 */
export default function BottomNavigation() {
  const { theme } = useResponsive();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = useMemo(
    () => resolveBottomNavItems(currentPath),
    [currentPath],
  );

  if (navItems.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        zIndex: 1200,
        borderRadius: 0,
        bgcolor: theme.palette.background.default,
        boxShadow: 'none',
        borderTop: '1px solid',
        borderColor: theme.palette.divider,
        m: 0,
        p: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          height: '88px',
          width: '100%',
          pt: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '56px',
            px: { xs: 1, sm: 2 },
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mx: 'auto',
            }}
          >
          {navItems.map((item) => {
            const isActive = item.isBranchSwitcher
              ? isAttaBranchActive(currentPath, item)
              : isPathActive(currentPath, item.path);

            return (
              <React.Fragment key={`${item.id}-${item.path}`}>
                <Box
                  component={Link}
                  to={item.path}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    textDecoration: 'none',
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    opacity: item.isUnderConstruction ? 0.5 : 1,
                    pointerEvents: item.isUnderConstruction ? 'none' : 'auto',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRadius: '50%',
                      bgcolor: isActive ? 'action.selected' : 'transparent',
                      p: 1,
                    }}
                  >
                    <DynamicIcon iconKey={item.iconKey} size="small" />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      ...NAV_TYPO.bottomNavLabelSx,
                      fontWeight: isActive ? 500 : 400,
                      mt: 0.2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </React.Fragment>
            );
          })}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
