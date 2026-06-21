import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HubSectionShell } from '@shared/components/hub';
import { HabitCarouselAhora, HabitCarouselLuego } from '../habits';
import ObjetivosPreviewSection from '../objetivos/ObjetivosPreviewSection';
import TareasHubSection from '../tasks/list/TareasHubSection';
import { useTareasPageController } from '../tasks/list/useTareasPageController';
import TareasPageOverlays from '../tasks/list/TareasPageOverlays';
import focoConfig from '../../config/app';

const scrollContainerSx = {
  py: { xs: 1, sm: 2 },
  px: { xs: 0, sm: 1 },
  height: { xs: 'calc(100vh - 160px)', sm: 'calc(100vh - 170px)' },
  overflowY: 'auto',
  overflowX: 'hidden',
  pb: { xs: 8, sm: 12 },
  '&::-webkit-scrollbar': { width: { xs: '4px', sm: '8px' } },
  '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.1)' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(0,0,0,0.3)' },
};

export default function FocoHubPage() {
  const navigate = useNavigate();

  const controller = useTareasPageController();

  const {
    loading,
    objetivos,
    isMobile,
    agendaView,
    tareasAgenda,
    tareasAhora,
    tareasLuego,
    tareasTableCommonProps,
    refetchObjetivos,
    isFormOpen,
    setIsFormOpen,
    editingTarea,
    isGoogleTasksConfigOpen,
    setIsGoogleTasksConfigOpen,
    selectedTareas,
    handleDeactivateMultiSelect,
    handleFormSubmit,
    createWithHistory,
    updateWithHistory,
    deleteWithHistory,
  } = controller;

  const HabitCarousel = agendaView === 'luego' ? HabitCarouselLuego : HabitCarouselAhora;

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={scrollContainerSx}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <HubSectionShell
                title="Hábitos"
                onTitleClick={() => navigate(focoConfig.routes.rutinas)}
              >
                <HabitCarousel variant="iconsRow" showDividers={false} />
              </HubSectionShell>
              <ObjetivosPreviewSection titleOnly />
              <TareasHubSection
                isMobile={isMobile}
                agendaView={agendaView}
                tareasAgenda={tareasAgenda}
                tareasAhora={tareasAhora}
                tareasLuego={tareasLuego}
                tareasTableCommonProps={tareasTableCommonProps}
              />
            </>
          )}
        </Box>

        <TareasPageOverlays
          isMobile={isMobile}
          isFormOpen={isFormOpen}
          setIsFormOpen={setIsFormOpen}
          editingTarea={editingTarea}
          objetivos={objetivos}
          refetchObjetivos={refetchObjetivos}
          handleFormSubmit={handleFormSubmit}
          createWithHistory={createWithHistory}
          updateWithHistory={updateWithHistory}
          deleteWithHistory={deleteWithHistory}
          isGoogleTasksConfigOpen={isGoogleTasksConfigOpen}
          setIsGoogleTasksConfigOpen={setIsGoogleTasksConfigOpen}
          selectedTareas={selectedTareas}
          onDeactivateMultiSelect={handleDeactivateMultiSelect}
        />
      </Box>
    </Box>
  );
}
