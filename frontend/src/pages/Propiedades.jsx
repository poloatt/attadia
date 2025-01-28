import { Button, Grid, Paper, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function Propiedades() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nueva Propiedad
        </Button>
      </div>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Propiedades Activas</Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
