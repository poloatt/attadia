import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Box,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import { iconConfig } from './utils/iconConfig';

const ChecklistSection = ({ title, items = {}, onChange, section, completitud }) => {
  // Filtrar solo los items que tienen iconos configurados
  const validItems = Object.entries(items).filter(([key]) => 
    iconConfig[section] && iconConfig[section][key]
  );

  return (
    <TableRow sx={{ 
      '&:last-child td, &:last-child th': { border: 0 },
      backgroundColor: 'transparent'
    }}>
      <TableCell 
        colSpan={2}
        sx={{ 
          position: 'relative',
          pt: 1.5,
          pb: 0.5,
          px: 2,
          backgroundColor: 'transparent'
        }}
      >
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          sx={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 0.5
          }}
        >
          {title}
        </Typography>
        <Stack 
          direction="row" 
          spacing={0.5}
          flexWrap="wrap" 
          useFlexGap 
          justifyContent="flex-start"
          sx={{ 
            gap: 0.5,
            '& > *': { 
              minWidth: 28,
              height: 28
            }
          }}
        >
          {validItems.map(([key, value]) => {
            const IconOutlined = iconConfig[section][key].outlined;
            const IconFilled = iconConfig[section][key].filled;
            const tooltip = iconConfig[section][key].tooltip;

            return (
              <Tooltip 
                key={key}
                title={tooltip}
                placement="top"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      '& .MuiTooltip-arrow': {
                        color: 'background.paper',
                      },
                      boxShadow: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.75rem'
                    }
                  }
                }}
              >
                <IconButton
                  onClick={() => onChange(section, key, !value)}
                  color={value ? 'primary' : 'default'}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    color: value ? 'primary.main' : 'text.disabled',
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.25rem'
                    },
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: value ? 'primary.dark' : 'text.primary'
                    }
                  }}
                >
                  {value ? <IconFilled /> : <IconOutlined />}
                </IconButton>
              </Tooltip>
            );
          })}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export default ChecklistSection; 