/** Registro inyectado por cada app para toolbar y slots de AgendaUnifiedBar. */

let toolbarModules = [];
const agendaBarSlots = {};
let RutinaDateHeroBarComponent = null;

export function registerToolbarModules(modules) {
  toolbarModules = modules;
}

export function getToolbarModules() {
  return toolbarModules;
}

export function registerAgendaBarSlots(slots) {
  Object.assign(agendaBarSlots, slots);
}

export function getAgendaBarSlot(name) {
  return agendaBarSlots[name] || null;
}

export function registerRutinaDateHeroBar(Component) {
  RutinaDateHeroBarComponent = Component;
}

export function getRutinaDateHeroBar() {
  return RutinaDateHeroBarComponent;
}

/** @deprecated Usar registerRutinaDateHeroBar */
export function registerRutinaNavigation(Component) {
  registerRutinaDateHeroBar(Component);
}

/** @deprecated Usar getRutinaDateHeroBar */
export function getRutinaNavigation() {
  return getRutinaDateHeroBar();
}
