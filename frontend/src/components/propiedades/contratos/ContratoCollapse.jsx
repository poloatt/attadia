import React from 'react';
import { Box, Collapse, IconButton, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Componente estilizado para el colapso de contratos
const StyledCollapse = styled(Collapse)(({ theme }) => ({
  borderRadius: 0,
  overflow: 'hidden',
  '& .MuiCollapse-wrapper': {
    borderRadius: 0
  },
  '& .MuiCollapse-wrapperInner': {
    borderRadius: 0
  }
}));

// Componente de header para el colapso
const CollapseHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 1.5),
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)'
  }
}));

// Componente de contenido del colapso
const CollapseContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: 'transparent',
  borderRadius: 0
}));

const ContratoCollapse = ({ 
  title, 
  expanded, 
  onToggle, 
  children, 
  showHeader = true,
  headerIcon = null,
  sx = {}
}) => {
  return (
    <Box sx={{ borderRadius: 0, overflow: 'hidden', ...sx }}>
      {showHeader && (
        <CollapseHeader onClick={onToggle}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {headerIcon}
            {title && (
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                {title}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            sx={{ 
              color: 'text.secondary',
              padding: 0.5,
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </CollapseHeader>
      )}
      
      <StyledCollapse in={expanded} timeout={200}>
        <CollapseContent>
          {children}
        </CollapseContent>
      </StyledCollapse>
    </Box>
  );
};

export default ContratoCollapse; 
