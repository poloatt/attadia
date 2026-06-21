/** Registro inyectado por cada app para toolbar y slots de AgendaUnifiedBar. */

let toolbarModules = [];
const agendaBarSlots = {};
let RutinaNavigationComponent = null;

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

export function registerRutinaNavigation(Component) {
  RutinaNavigationComponent = Component;
}

export function getRutinaNavigation() {
  return RutinaNavigationComponent;
}
