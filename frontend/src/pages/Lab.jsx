import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Lab() {
  return (
    <EntityDetails 
      title="Laboratorio"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Nuevo Experimento
        </Button>
      }
    >
      {/* Contenido del laboratorio */}
    </EntityDetails>
  );
}
