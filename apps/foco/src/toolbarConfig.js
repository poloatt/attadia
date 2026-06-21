import {
  registerToolbarModules,
  registerAgendaBarSlots,
  registerRutinaNavigation,
} from '@shared/navigation/toolbarRegistry';
import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';
import ObjetivosToolbarCenter from './foco/ObjetivosToolbarCenter.jsx';
import TareasToolbarCenter from './foco/TareasToolbarCenter.jsx';
import TiempoToolbarRight from './foco/TiempoToolbarRight.jsx';
import FocoViewModeToggle from './foco/FocoViewModeToggle.jsx';
import TiempoToolbarActions from './foco/TiempoToolbarActions.jsx';
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
  focoViewModeToggle: FocoViewModeToggle,
});

registerRutinaNavigation(RutinaNavigation);
