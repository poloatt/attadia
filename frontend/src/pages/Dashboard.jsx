import { Box } from '@mui/material';
import EntityDetails from '../components/EntityDetails';

export default function Dashboard() {
  return (
    <Box sx={{ 
      display: 'grid',
      gap: 2,
      gridTemplateRows: 'repeat(3, 1fr)', // Divide en 3 filas iguales
      height: 'calc(100vh - 80px)', // Altura total menos header y padding
    }}>
      <EntityDetails title="Resumen de Transacciones">
        {/* Contenido del resumen */}
      </EntityDetails>

      <EntityDetails title="Rutinas Pendientes">
        {/* Contenido de rutinas */}
      </EntityDetails>

      <EntityDetails title="Proyectos Activos">
        {/* Contenido de proyectos */}
      </EntityDetails>
    </Box>
  );
}
