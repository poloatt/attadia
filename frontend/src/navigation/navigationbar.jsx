import React from 'react';
import { useNavigationBar } from '../context/NavigationBarContext';
import { styled } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#000000',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  transform: 'translateY(0)',
  transition: 'transform 0.3s ease-in-out',
  '&.hidden': {
    transform: 'translateY(-100%)',
  },
}));

const StyledToolbar = styled(Toolbar)({
  minHeight: '48px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 16px',
});

const MinimalNavigationBar = () => {
  const { isVisible, title, actions } = useNavigationBar();

  if (!isVisible) return null;

  return (
    <StyledAppBar className={!isVisible ? 'hidden' : ''}>
      <StyledToolbar>
        <Typography variant="subtitle1" component="div" sx={{ color: 'white' }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions.map((action, index) => (
            <Box key={index} onClick={action.onClick} sx={{ cursor: 'pointer' }}>
              {action.component}
            </Box>
          ))}
        </Box>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default MinimalNavigationBar;