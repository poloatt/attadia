import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActions,
  IconButton,
  Box,
  Chip,
  Stack
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

const EntityCards = ({ data, cardConfig, onEdit, onDelete }) => {
  return (
    <Grid container spacing={4}>
      {data.map((item) => (
        <Grid item key={item.id} xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {cardConfig.getImage(item) && (
              <CardMedia
                component="img"
                height="200"
                image={cardConfig.getImage(item)}
                alt={cardConfig.getTitle(item)}
              />
            )}
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h5" component="h2">
                {cardConfig.getTitle(item)}
              </Typography>
              
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <LocationOnIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {cardConfig.getSubtitle(item)}
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" paragraph>
                {cardConfig.getDescription(item)}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Stack direction="row" spacing={2}>
                  <Chip
                    icon={<SquareFootIcon />}
                    label={`${cardConfig.getMetrosCuadrados(item)} m²`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<BedOutlinedIcon />}
                    label={cardConfig.getHabitaciones(item)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<BathtubOutlinedIcon />}
                    label={cardConfig.getBanos(item)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>

              <Typography 
                variant="h6" 
                color="primary" 
                sx={{ mt: 2 }}
              >
                ${cardConfig.getAmount(item).toLocaleString()}
              </Typography>
            </CardContent>

            <CardActions>
              <IconButton 
                size="small" 
                onClick={() => onEdit(item.id)}
                aria-label="editar"
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => onDelete(item.id)}
                aria-label="eliminar"
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default EntityCards; 