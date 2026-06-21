import React, { useEffect, useState } from 'react';
import { HabitsManager } from './templates/HabitsManager';

/** Escucha `openHabitTemplates` y monta el diálogo de personalización de rutina. */
export default function HabitsManagerHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('openHabitTemplates', handleOpen);
    return () => window.removeEventListener('openHabitTemplates', handleOpen);
  }, []);

  return (
    <HabitsManager
      open={open}
      onClose={() => setOpen(false)}
    />
  );
}
