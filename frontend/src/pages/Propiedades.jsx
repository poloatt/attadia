import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Propiedades() {
  return (
    <EntityDetails 
      title="Propiedades"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Nueva Propiedad
        </Button>
      }
    >
      {/* Contenido de propiedades */}
    </EntityDetails>
  );
}
