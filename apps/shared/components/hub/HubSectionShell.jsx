import React from 'react';
import { Box } from '@mui/material';
import HubSectionHeader from './HubSectionHeader';
import { hubSectionShellSx, hubSectionShellBodySx } from '../../styles/hubSectionStyles';

/**
 * Shell embebido: contenedor redondeado + cabecera + cuerpo.
 * Para previews en páginas (Foco Tareas) sin Card navegable completa.
 */
export default function HubSectionShell({
  title,
  onTitleClick,
  iconKey,
  isActive,
  children,
  shellSx,
  headerSx,
  bodySx,
  titleOnly = false,
}) {
  return (
    <Box sx={{ ...hubSectionShellSx, ...shellSx }}>
      <HubSectionHeader
        title={title}
        onTitleClick={onTitleClick}
        iconKey={iconKey}
        isActive={isActive}
        headerSx={headerSx}
      />
      {!titleOnly && (
        <Box sx={{ ...hubSectionShellBodySx, ...bodySx }}>{children}</Box>
      )}
    </Box>
  );
}
