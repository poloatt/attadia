import React from 'react';
import { SystemButtons } from '@shared/components/common/SystemButtons';

export default function FocoUndoButton({ buttonSx, scope }) {
  return <SystemButtons.ScopedUndoButton buttonSx={buttonSx} scope={scope} />;
}
