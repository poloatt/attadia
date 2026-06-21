import { useEffect, useState } from 'react';

/** Vista Ahora/Luego solo para RutinasActionStrip (hábitos), no filtra tareas del calendario. */
export function useHabitsAgendaView(defaultView = 'ahora') {
  const [agendaView, setAgendaView] = useState(defaultView);

  useEffect(() => {
    const handleAgendaViewChanged = (event) => {
      const { view } = event.detail || {};
      if (view === 'ahora' || view === 'luego') setAgendaView(view);
    };
    window.addEventListener('agendaViewChanged', handleAgendaViewChanged);
    return () => window.removeEventListener('agendaViewChanged', handleAgendaViewChanged);
  }, []);

  return agendaView;
}
