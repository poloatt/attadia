import { resolveFlatModulePages } from '@shared/navigation/appNavResolver';

/** Secciones Pulso derivadas de menuStructure. */
export function getPulsoNavTargets() {
  return resolveFlatModulePages('salud');
}
