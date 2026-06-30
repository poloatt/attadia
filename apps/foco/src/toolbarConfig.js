import {

  registerToolbarModules,

  registerAgendaBarSlots,

  registerRutinaDateHeroBar,

} from '@shared/navigation/toolbarRegistry';

import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';

import {

  AgendaToolbarCenter,

  ObjetivosToolbarCenter,

  TareasToolbarCenter,

  TiempoToolbarRight,

  TiempoToolbarActions,

  FocoToolbarLeft,

} from './features/toolbar';

import RutinaDateHeroBar from './features/habits/daily/RutinaDateHeroBar.jsx';



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

    // Navegación diaria (date hero) vive en RutinaPageNavigationBar vía registerRutinaDateHeroBar.
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
  agendaViewToggle: AgendaToolbarCenter,
});



registerRutinaDateHeroBar(RutinaDateHeroBar);

