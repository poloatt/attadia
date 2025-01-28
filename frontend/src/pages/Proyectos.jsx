import { Button, Grid, Paper, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function Proyectos() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nuevo Proyecto
        </Button>
      </div>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Proyectos en Desarrollo</Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
