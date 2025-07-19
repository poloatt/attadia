import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import { useSidebar } from '../../context/SidebarContext';

export default function HeaderMenuButton({ sx }) {
  const { toggleSidebar } = useSidebar();

  return (
    <IconButton
      onClick={toggleSidebar}
      sx={{
        width: 40,
        height: 40,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
        color: 'inherit',
        position: 'relative',
        left: 0,
        '&:hover': { color: 'text.primary', background: 'action.hover' },
        ...sx
      }}
      aria-label="Abrir menú"
    >
      <MenuIcon sx={sx || { fontSize: 18, color: 'text.secondary' }} />
    </IconButton>
  );
} 
