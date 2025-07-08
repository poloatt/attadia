import { IconButton, Tooltip } from '@mui/material';
import { 
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon
} from '@mui/icons-material';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';

export default function HeaderVisibilityButton() {
  const { showValues, toggleValuesVisibility } = useValuesVisibility();

  return (
    <Tooltip title={showValues ? 'Ocultar valores' : 'Mostrar valores'}>
      <IconButton 
        size="small"
        onClick={toggleValuesVisibility}
        sx={{ 
          color: 'inherit',
          '&:hover': { color: 'text.primary' }
        }}
      >
        {showValues ? 
          <HideValuesIcon sx={{ fontSize: 20 }} /> : 
          <ShowValuesIcon sx={{ fontSize: 20 }} />
        }
      </IconButton>
    </Tooltip>
  );
} 