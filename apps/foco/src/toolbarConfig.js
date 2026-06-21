import {
  registerToolbarModules,
  registerAgendaBarSlots,
  registerRutinaNavigation,
} from '@shared/navigation/toolbarRegistry';
import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';
import {
  ObjetivosToolbarCenter,
  TareasToolbarCenter,
  TiempoToolbarRight,
  AgendaViewModeToggle,
  TiempoToolbarActions,
} from './features/toolbar';
import RutinaNavigation from '@shared/navigation/RutinaNavigation.jsx';

registerToolbarModules([
  {
    id: 'foco',
    match: (path) => matchTiempoSection(path) === 'foco',
    center: null,
    centerDesktop: false,
    right: TiempoToolbarRight,
  },
  {
    id: 'objetivos',
    match: (path) => matchTiempoSection(path) === 'objetivos',
    center: ObjetivosToolbarCenter,
    centerDesktop: true,
    right: TiempoToolbarRight,
  },
  {
    id: 'tareas',
    match: (path) => matchTiempoSection(path) === 'tareas',
    center: TareasToolbarCenter,
    centerDesktop: true,
    right: TiempoToolbarRight,
  },
]);

registerAgendaBarSlots({
  focoCenterActions: TiempoToolbarActions,
  focoViewModeToggle: AgendaViewModeToggle,
});

registerRutinaNavigation(RutinaNavigation);
