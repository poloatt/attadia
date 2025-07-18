import { IconButton, Tooltip } from '@mui/material';
import { 
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon
} from '@mui/icons-material';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';

export default function HeaderVisibilityButton({ iconSx }) {
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
          <HideValuesIcon sx={iconSx} /> : 
          <ShowValuesIcon sx={iconSx} />
        }
      </IconButton>
    </Tooltip>
  );
} 