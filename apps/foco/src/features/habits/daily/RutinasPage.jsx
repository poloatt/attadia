import React from 'react';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import RutinaTable from './RutinaTable';
import { RutinaForm } from './RutinaForm';
import { HabitsManager } from '../templates/HabitsManager';
import HubSectionShell from '@shared/components/hub/HubSectionShell';
import { useRutinasPageController } from './useRutinasPageController';
import {
  rutinaPageMainSx,
  rutinaPageContainerSx,
  rutinaPageScrollSx,
  rutinaPageLoaderSx,
  rutinaEmptyStatePaperSx,
  rutinaErrorStatePaperSx,
} from '@shared/styles/rutinaPageStyles';
import { RUTINA_NAVIGATION_BAR_CONFIG } from '@shared/config/uiConstants';
import {
  CalendarMonthOutlined as DateIcon,
  Info as InfoIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const rutinaHubShellBodySx = {
  pt: 0,
  py: 0.75,
  gap: 0.75,
  minHeight: 0,
  px: 0,
};

function EmptyStateMessage({ error, onAdd }) {
  if (error) {
    return (
      <Paper elevation={0} sx={rutinaErrorStatePaperSx}>
        <InfoIcon color="error" />
        <Typography variant="body2">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={rutinaEmptyStatePaperSx}>
      <DateIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
      <Typography variant="h6">No hay registro para este día</Typography>
      <Typography variant="body2" color="text.secondary">
        Crea un registro con el botón + de la barra superior o el botón de abajo.
      </Typography>
      <Box mt={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          Crear registro
        </Button>
      </Box>
    </Paper>
  );
}

const RutinasWithContext = () => {
  const {
    rutina,
    rutinas,
    loading,
    error,
    editMode,
    rutinaToEdit,
    currentPage,
    totalPages,
    habitsManagerOpen,
    setHabitsManagerOpen,
    handleAddRutina,
    handleCloseForm,
    isMobile,
    scrollBottomPadding,
  } = useRutinasPageController();

  return (
    <Box component="main" className="page-main-content" sx={rutinaPageMainSx}>
      <Box sx={{ ...rutinaPageContainerSx, pb: { xs: 10, sm: 4 } }}>
        <Box sx={rutinaPageScrollSx(isMobile, scrollBottomPadding, RUTINA_NAVIGATION_BAR_CONFIG.height)}>
          {loading && (
            <Box sx={rutinaPageLoaderSx}>
              <CircularProgress />
            </Box>
          )}

          {!loading && !rutina && !editMode && (
            <HubSectionShell
              title="Rutinas"
              iconKey="fitnessCenter"
              shellSx={{ width: '100%' }}
              bodySx={{ ...rutinaHubShellBodySx, pt: 0 }}
            >
              <EmptyStateMessage error={error} onAdd={handleAddRutina} />
            </HubSectionShell>
          )}

          {!loading && !editMode && rutina && (
            <HubSectionShell
              headerContent={<></>}
              shellSx={{ width: '100%' }}
              bodySx={rutinaHubShellBodySx}
            >
              <RutinaTable
                rutina={{
                  ...rutina,
                  _page: currentPage,
                  _totalPages: totalPages,
                }}
                rutinas={rutinas}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </HubSectionShell>
          )}

          {editMode && (
            <RutinaForm
              open
              onClose={handleCloseForm}
              initialData={rutinaToEdit}
              isEditing={!!rutinaToEdit}
            />
          )}
        </Box>
      </Box>

      <HabitsManager
        open={habitsManagerOpen}
        onClose={() => setHabitsManagerOpen(false)}
      />
    </Box>
  );
};

const Rutinas = () => <RutinasWithContext />;

export default Rutinas;
