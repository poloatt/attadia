import {

  registerToolbarModules,

  registerAgendaBarSlots,

  registerRutinaNavigation,

} from '@shared/navigation/toolbarRegistry';

import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';

import {

  AgendaToolbarCenter,

  ObjetivosToolbarCenter,

  TareasToolbarCenter,

  TiempoToolbarRight,

  AgendaViewModeToggle,

  TiempoToolbarActions,

  FocoToolbarLeft,

} from './features/toolbar';

import RutinaNavigation from '@shared/navigation/RutinaNavigation.jsx';



const focoLeft = { left: FocoToolbarLeft };



registerToolbarModules([

  {

    id: 'hub',

    match: (path) => matchTiempoSection(path) === 'hub',

    ...focoLeft,

    center: TareasToolbarCenter,

    centerDesktop: true,

    right: TiempoToolbarRight,

  },

  {

    id: 'agenda',

    match: (path) => matchTiempoSection(path) === 'agenda',

    ...focoLeft,

    center: null,

    centerDesktop: false,

    right: TiempoToolbarRight,

  },

  {

    id: 'objetivos',

    match: (path) => matchTiempoSection(path) === 'objetivos',

    ...focoLeft,

    center: ObjetivosToolbarCenter,

    centerDesktop: true,

    right: TiempoToolbarRight,

  },

  {

    id: 'tareas',

    match: (path) => matchTiempoSection(path) === 'tareas',

    ...focoLeft,

    center: TareasToolbarCenter,

    centerDesktop: true,

    right: TiempoToolbarRight,

  },

  {

    id: 'rutinas',

    match: (path) => path === '/rutinas' || path.startsWith('/rutinas/'),

    ...focoLeft,

    center: null,

    centerDesktop: false,

    right: TiempoToolbarRight,

  },

  {

    id: 'archivo',

    match: (path) => path === '/archivo' || path.startsWith('/archivo/'),

    ...focoLeft,

    center: null,

    centerDesktop: false,

    right: TiempoToolbarRight,

  },

]);



registerAgendaBarSlots({
  focoCenterActions: TiempoToolbarActions,
  focoViewModeToggle: AgendaViewModeToggle,
  agendaViewToggle: AgendaToolbarCenter,
});



registerRutinaNavigation(RutinaNavigation);

