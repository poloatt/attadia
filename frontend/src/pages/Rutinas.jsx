import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Rutinas() {
  return (
    <EntityDetails 
      title="Rutinas"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Nueva Rutina
        </Button>
      }
    >
      {/* Contenido de rutinas */}
    </EntityDetails>
  );
}
