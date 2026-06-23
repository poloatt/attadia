import React from 'react';
import { SystemButtons } from '@shared/components/common/SystemButtons';

function FocoUndoButton({ buttonSx, scope }) {
  return <SystemButtons.ScopedUndoButton buttonSx={buttonSx} scope={scope} />;
}

FocoUndoButton.isButtonComponent = true;

export default FocoUndoButton;
