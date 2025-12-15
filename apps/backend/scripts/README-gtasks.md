# Runbook - Google Tasks (Auditoría, Limpieza y Normalización)

Este runbook documenta los comandos de mantenimiento para la integración con Google Tasks.

## Scripts disponibles

- Normalizar títulos (remueve prefijos entre corchetes, colapsa espacios):

```bash
node apps/backend/scripts/normalize-task-titles.js --user="EMAIL|ID" --project-name="Salud,Trámites" --google --dry-run=false
```

- Deduplicar subtareas (BD y opcionalmente Google):

```bash
node apps/backend/scripts/cleanup-duplicate-subtasks.js --user="EMAIL|ID" --project-name="Salud" --google --dry-run=false
```

- Deduplicar tareas padre (BD y opcionalmente Google):

```bash
node apps/backend/scripts/cleanup-duplicate-tasks.js --user="EMAIL|ID" --project-name="Trámites" --google-parents --dry-run=false
```

- Auditoría de consistencia (duplicados/órfanos) por proyecto:

```bash
node apps/backend/scripts/audit-google-tasks-consistency.js --user="EMAIL|ID" --project-name="Salud,Trámites" --google
```

- Reparar “padre = igual subtarea” por proyecto (mantiene subtareas, elimina padres):

```bash
node apps/backend/scripts/fix-main-equals-subtasks.js --user="EMAIL|ID" --project-name="Salud" --google --dry-run=false
```

## Parámetros

- `--user`: email o ID del usuario.
- `--project`: ID del proyecto (opcional).
- `--project-name`: nombre(s) de proyecto, separados por coma (case/acentos ignorados).
- `--google`: aplica también en Google Tasks (cuando corresponde).
- `--dry-run`: por defecto es `true`. Usar `--dry-run=false` para aplicar cambios.

## Recomendaciones operativas

- Ejecutar primero en `--dry-run` y revisar salida.
- Aplicar por proyecto (o subconjuntos) para evitar picos de cuota.
- Ejecutar auditoría después de cada limpieza para validar el estado final.

## Sincronización con métricas

Ejecutar un full sync con métricas y control de lotes/concurrencia:

```bash
node apps/backend/scripts/run-full-sync.js --user="EMAIL" --limit=25 --concurrency=3
```

La salida incluye `timings`, `batches`, `errorsByReason` y flags de cuota. Además, el import reporta métricas de limpieza post-import: `deletedLocalNotInGoogle`, `dedupLocalGroups`, `dedupLocalRemoved`.


