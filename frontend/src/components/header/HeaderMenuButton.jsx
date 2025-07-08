import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import { useSidebar } from '../../context/SidebarContext';

export default function HeaderMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <IconButton
      onClick={toggleSidebar}
      sx={{
        width: 56,
        height: 56,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
        color: 'inherit',
        position: 'relative',
        left: 0, // Ajusta si necesitas compensar el borde
        '&:hover': { color: 'text.primary', background: 'action.hover' }
      }}
      aria-label="Abrir menú"
    >
      <MenuIcon sx={{ fontSize: 24 }} />
    </IconButton>
  );
} 