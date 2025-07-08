import { IconButton, Tooltip } from '@mui/material';
import { AddOutlined as AddIcon } from '@mui/icons-material';

export default function HeaderAddButton({ entityConfig }) {
  if (!entityConfig) return null;

  return (
    <Tooltip title={`Agregar ${entityConfig.name}`}>
      <IconButton 
        size="small"
        onClick={entityConfig.action}
        sx={{ 
          color: 'inherit',
          background: 'none',
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          padding: 0.5,
          '&:hover': { 
            background: 'rgba(255,255,255,0.08)',
            color: 'inherit',
            boxShadow: 'none'
          }
        }}
      >
        <AddIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Tooltip>
  );
} 