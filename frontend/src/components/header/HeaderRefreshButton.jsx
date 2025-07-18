import { IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export default function HeaderRefreshButton({ iconSx }) {
  return (
    <Tooltip title="Recargar app">
      <IconButton 
        size="small"
        onClick={() => window.location.reload()}
        sx={{ color: 'inherit', '&:hover': { color: 'text.primary' } }}
      >
        <RefreshIcon sx={iconSx} />
      </IconButton>
    </Tooltip>
  );
} 