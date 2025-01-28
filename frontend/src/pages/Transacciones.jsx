import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function Transacciones() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* Aquí irá la lógica para abrir el modal de nueva transacción */}}
        >
          Nueva Transacción
        </Button>
      </div>

      <TableContainer component={Paper}>
        {/* ... resto del contenido ... */}
      </TableContainer>
    </div>
  );
}
