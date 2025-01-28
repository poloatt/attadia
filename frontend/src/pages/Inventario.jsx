import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityDetails';

export default function Inventario() {
  return (
    <EntityDetails 
      title="Inventario"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Nuevo Item
        </Button>
      }
    >
      {/* Contenido del inventario */}
    </EntityDetails>
  );
}
