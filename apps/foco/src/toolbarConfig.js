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

  TiempoToolbarActions,

  FocoToolbarLeft,

  ArchivoToolbarCenter,

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

    // La navegación diaria (prev/next, Hoy, date picker, %) vive en RutinaNavigation vía registerRutinaNavigation.
    center: null,

    centerDesktop: false,

    right: TiempoToolbarRight,

  },

  {

    id: 'archivo',

    match: (path) => path === '/archivo' || path.startsWith('/archivo/'),

    ...focoLeft,

    center: ArchivoToolbarCenter,

    centerDesktop: true,

    right: TiempoToolbarRight,

  },

]);



registerAgendaBarSlots({
  focoCenterActions: TiempoToolbarActions,
  agendaViewToggle: AgendaToolbarCenter,
});



registerRutinaNavigation(RutinaNavigation);

