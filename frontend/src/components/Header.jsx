import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box,
  Tooltip
} from '@mui/material';
import { 
  PsychologyOutlined as BrainIcon,
  SettingsOutlined as SettingsIcon
} from '@mui/icons-material';
import { useSidebar } from '../context/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const getRouteTitle = () => {
    const path = location.pathname.split('/')[1];
    return path.charAt(0).toUpperCase() + path.slice(1) || 'inicio';
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: 40
      }}
    >
      <Toolbar 
        variant="dense"
        sx={{ 
          minHeight: 40,
          height: 40,
          px: {
            xs: 1,
            sm: 2,
            md: 3
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ 
              color: 'inherit',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <BrainIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'inherit',
              fontSize: '0.875rem'
            }}
          >
            Present / {getRouteTitle()}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Configuración">
            <IconButton 
              size="small"
              onClick={toggleSidebar}
              sx={{ 
                color: 'inherit',
                '&:hover': { color: 'text.primary' }
              }}
            >
              <SettingsIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 