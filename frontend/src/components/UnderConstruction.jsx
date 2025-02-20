import React from 'react';
import { Box, Typography, keyframes, useTheme } from '@mui/material';
import { 
  PetsOutlined,
  Pets,
  HandymanOutlined,
  Handyman,
  GroupsOutlined,
  Groups,
  ConstructionOutlined,
  Construction
} from '@mui/icons-material';

const morphAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
`;

const moveLeftRight = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
`;

const BuilderAnimal = ({ OutlinedIcon, FilledIcon, delay, label }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        position: 'relative',
        animation: `${moveLeftRight} 4s infinite ease-in-out`,
        animationDelay: delay,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Box sx={{ position: 'relative', width: 38, height: 38 }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            animation: `${morphAnimation} 2s infinite ease-in-out`,
            animationDelay: delay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            '& > svg': {
              fontSize: 38,
              color: theme.palette.text.secondary
            }
          }}
        >
          <OutlinedIcon />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            animation: `${morphAnimation} 2s infinite ease-in-out reverse`,
            animationDelay: delay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            '& > svg': {
              fontSize: 38,
              color: theme.palette.primary.main
            }
          }}
        >
          <FilledIcon />
        </Box>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          opacity: 0.8,
          fontWeight: 500
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export function UnderConstruction() {
  return (
    <Box sx={{ 
      mt: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }}>
      <Box sx={{
        display: 'flex',
        gap: 4,
        mb: 2
      }}>
        <BuilderAnimal 
          OutlinedIcon={PetsOutlined} 
          FilledIcon={Pets} 
          delay="0s"
          label="Castor Constructor"
        />
        <BuilderAnimal 
          OutlinedIcon={HandymanOutlined} 
          FilledIcon={Handyman} 
          delay="0.5s"
          label="Mapache Técnico"
        />
        <BuilderAnimal 
          OutlinedIcon={GroupsOutlined} 
          FilledIcon={Groups} 
          delay="1s"
          label="Equipo Ardilla"
        />
        <BuilderAnimal 
          OutlinedIcon={ConstructionOutlined} 
          FilledIcon={Construction} 
          delay="1.5s"
          label="Oso Capataz"
        />
      </Box>

      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ 
          textAlign: 'center',
          maxWidth: 300,
          opacity: 0.9,
          lineHeight: 1.6
        }}
      >
        Nuestro equipo de animalitos está trabajando en esta funcionalidad
      </Typography>
    </Box>
  );
}

export default UnderConstruction; 