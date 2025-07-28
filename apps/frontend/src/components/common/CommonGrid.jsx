import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Stack,
  Collapse,
  Chip,
  Tooltip
} from '@mui/material';
import CommonActions from '../common/CommonActions';
import { KeyboardArrowDown as ExpandIcon } from '@mui/icons-material';
import { getStatusIconComponent, getEstadoColor, getEstadoText } from '../common/StatusSystem';

const EstadoChip = ({ estado, tipo = 'PROPIEDAD', sx = {} }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 1,
      py: 0.5,
      fontSize: '0.75rem',
      color: getEstadoColor(estado, tipo),
      bgcolor: 'transparent',
      borderRadius: 0,
      fontWeight: 600,
      height: 24,
      minWidth: 'fit-content',
      ...sx
    }}
  >
    {getStatusIconComponent(estado, tipo)}
    <span>{getEstadoText(estado, tipo)}</span>
  </Box>
);

const CommonGrid = ({ 
  data = [], 
  config = {}, 
  gridProps = {} 
}) => {
  const groupedData = useMemo(() => {
    const groups = {};
    
    data.forEach(item => {
      const groupInfo = config.groupBy(item);
      const key = groupInfo.key;
      
      if (!groups[key]) {
        groups[key] = {
          info: groupInfo,
          items: []
        };
      }
      
      groups[key].items.push(item);
    });
    
    return Object.values(groups);
  }, [data, config]);

  // Inicializar el estado de expansión para cada grupo como true (expandido)
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initialState = {};
    groupedData.forEach(group => {
      initialState[group.info.key] = true;
    });
    return initialState;
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  return (
    <Stack spacing={0.8}>
      {groupedData.map(group => (
        <Box key={group.info.key}>
          <Box 
            onClick={() => toggleGroup(group.info.key)}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.4,
              height: 26,
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <Tooltip title={expandedGroups[group.info.key] ? 'Ocultar' : 'Expandir'}>
              <span>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0,
                    transform: expandedGroups[group.info.key] ? 'rotate(-180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <ExpandIcon />
                </IconButton>
              </span>
            </Tooltip>
            {group.info.icon && (React.isValidElement(group.info.icon) ? group.info.icon : React.createElement(group.info.icon))}
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                lineHeight: 1,
                flexGrow: 1
              }}
            >
              {group.info.label}
            </Typography>
            <Chip
              size="small"
              label={`${group.items.length} ${group.items.length === 1 ? 'habitación' : 'habitaciones'}`}
              sx={{ 
                height: 20,
                borderRadius: 0,
                bgcolor: 'action.selected'
              }}
            />
          </Box>

          <Collapse in={expandedGroups[group.info.key]} timeout={200}>
            <Grid container spacing={0.4} sx={{ p: 0 }}>
              {group.items.map((item, index) => (
                <Grid item key={item.id} {...gridProps}>
                  <Box
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        flexGrow: 1, 
                        px: 1.5,
                        py: 0.5
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        height: 24
                      }}>
                        <Typography 
                          variant="subtitle2"
                          sx={{ 
                            fontWeight: 500,
                            lineHeight: 1
                          }}
                        >
                          {config.getTitle(item)}
                        </Typography>
                        {config.getActions && (
                          <CommonActions {...config.getActions(item)} />
                        )}
                      </Box>

                      {config.getDetails(item).map((detail, i) => (
                        <Box 
                          key={i}
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.2,
                            height: 16
                          }}
                        >
                          {detail.icon && (React.isValidElement(detail.icon) ? detail.icon : React.createElement(detail.icon))}
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ lineHeight: 1 }}
                          >
                            {detail.text}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>
      ))}
    </Stack>
  );
};

export default CommonGrid; 
