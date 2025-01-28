import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Proyectos() {
  return (
    <EntityDetails 
      title="Proyectos"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Nuevo Proyecto
        </Button>
      }
    >
      {/* Contenido de proyectos */}
    </EntityDetails>
  );
}
