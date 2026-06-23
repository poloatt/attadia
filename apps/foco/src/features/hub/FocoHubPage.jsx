import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { hubPageScrollSx } from '@shared/styles/hubSectionStyles';
import ObjetivosPreviewSection from '../objetivos/ObjetivosPreviewSection';
import TareasHubSection from '../tasks/list/TareasHubSection';
import { useTareasPageController } from '../tasks/list/useTareasPageController';
import TareasPageOverlays from '../tasks/list/TareasPageOverlays';

export default function FocoHubPage() {
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

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={hubPageScrollSx({ isMobile, bottomPadding: isMobile ? 8 : 12 })}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
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
