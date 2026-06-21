import React from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { tareaFormDialogPaperSx } from '@shared/components/forms/tareaFormUi';

/**
 * Shared dialog shell for TareaForm and ObjetivoForm.
 */
export default function TareaFormDialogShell({ open, onClose, isMobile, children, zIndex = 1300 }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          ...tareaFormDialogPaperSx(isMobile),
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      sx={{
        zIndex,
        '& .MuiBackdrop-root': {
          bottom: isMobile ? '56px' : 0,
        },
      }}
    >
      <DialogContent
        sx={{
          bgcolor: 'background.paper',
          flex: 1,
          overflowY: 'auto',
          py: 0,
          px: 0,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
