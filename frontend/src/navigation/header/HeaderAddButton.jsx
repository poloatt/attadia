import { IconButton, Tooltip } from '@mui/material';
import { AddOutlined as AddIcon } from '@mui/icons-material';

export default function HeaderAddButton({ entityConfig, buttonSx }) {
  if (!entityConfig) return null;

  return (
    <Tooltip title={`Agregar ${entityConfig.name}`}>
      <IconButton 
        size="small"
        onClick={entityConfig.action}
        sx={{ 
          background: 'none',
          border: 'none',
          borderRadius: 1,
          boxShadow: 'none',
          padding: 0.5,
          color: 'text.secondary',
          '&:hover': { 
            background: 'rgba(255,255,255,0.08)',
            color: 'inherit',
            boxShadow: 'none'
          },
          ...buttonSx
        }}
      >
        <AddIcon sx={buttonSx || { fontSize: 18, color: 'text.secondary' }} />
      </IconButton>
    </Tooltip>
  );
} 
