import { Button } from '@mui/material';
import EntityDetails from '../components/EntityDetails';
import AddIcon from '@mui/icons-material/Add';

export default function Transacciones() {
  return (
    <EntityDetails 
      title="Transacciones"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Nueva Transacción
        </Button>
      }
    >
      {/* Contenido de transacciones */}
    </EntityDetails>
  );
}
