import React, { useEffect, useState } from 'react';
import { HabitsManager } from '../rutinas/HabitsManager';

/** Escucha `openHabitsManager` y monta el diálogo de personalización de rutina. */
export default function HabitsManagerHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('openHabitsManager', handleOpen);
    return () => window.removeEventListener('openHabitsManager', handleOpen);
  }, []);

  return (
    <HabitsManager
      open={open}
      onClose={() => setOpen(false)}
    />
  );
}
