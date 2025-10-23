<!-- e80e2244-7531-401a-91ff-14c754dcafb8 bd1d6f0a-f454-4973-8ad5-b3feb82642d3 -->
# Plan: Corrección del Servicio Google Tasks

## Problema Principal

El servicio actual tiene un mapeo confuso e inconsistente entre las entidades de Attadia y Google Tasks API, causando sincronización duplicada, pérdida de datos y errores.

## Mapeo Correcto (Arquitectura Objetivo)

```
ATTADIA                 →    GOOGLE TASKS API
─────────────────────────────────────────────
Proyecto                →    TaskList
Tarea                   →    Task (en su TaskList correspondiente)
Subtarea (embebida)     →    Task con campo parent (referencia)
```

## Cambios Necesarios

### 1. Modelo de Subtareas (apps/backend/src/models/Tareas.js)

**Problema**: Las subtareas no almacenan su `googleTaskId`, imposibilitando actualizaciones

**Solución**: Agregar campos de sincronización al schema de subtareas

```javascript
const subtareaSchema = new mongoose.Schema({
  titulo: String,
  completada: Boolean,
  orden: Number,
  // NUEVO: campos para sincronización con Google
  googleTaskId: String,      // ID de la tarea hija en Google
  googleTaskListId: String,  // TaskList donde está la subtarea
  lastSyncDate: Date
});
```

### 2. Sincronización de Proyectos → TaskLists (googleTasksService.js líneas 543-576)

**Problema**: La función `syncProyectosWithTaskLists()` NO crea TaskLists reales, solo asigna la misma lista a todos

**Solución**: Refactorizar para crear/actualizar TaskLists individuales por proyecto

Cambios:

- Crear una TaskList en Google por cada proyecto de Attadia
- Actualizar títulos de TaskLists cuando se renombra un proyecto
- Manejar eliminación de proyectos (eliminar TaskList en Google)
- Mapear correctamente `proyecto.googleTasksSync.googleTaskListId`

### 3. Sincronización de Tareas → Tasks (googleTasksService.js líneas 212-328)

**Problema**: La función `syncTaskToGoogle()` no usa el TaskList del proyecto, usa una "default"

**Solución**:

- Usar `tarea.proyecto.googleTasksSync.googleTaskListId` en lugar de `getOrCreateDefaultTaskList()`
- Eliminar lógica de normalización de títulos con prefijos (líneas 218-227, 884-915)
- Eliminar función `normalizeTitle()` que quita prefijos de proyecto
- Mantener solo limpieza básica de espacios y spam

### 4. Sincronización de Subtareas → Campo notes en Google Tasks

**Problema Crítico**: Google Tasks API no soporta subtareas embebidas. Si usamos tasks con `parent`, se duplican constantemente en cada sync porque son entidades independientes.

**Solución Correcta**:

- **NO sincronizar subtareas como tasks separadas en Google**
- **Usar el campo `notes` de la tarea para serializar las subtareas**
- Las subtareas permanecen embebidas en Attadia y se representan como texto en Google Tasks

**Implementación**:

Formato del campo `notes` en Google Tasks:

```
[Descripción de la tarea]

Subtareas:
☐ Subtarea 1 pendiente
☑ Subtarea 2 completada
☐ Subtarea 3 pendiente
```

- Al sincronizar a Google: serializar subtareas en `notes` con formato legible
- Al importar desde Google: parsear el campo `notes` y extraer subtareas al array embebido
- Usar caracteres especiales (☐/☑) para indicar estado completado/pendiente
- Si no hay subtareas, el campo `notes` solo contiene la descripción

**Ventajas**:

- No hay duplicación - las subtareas no son entidades separadas
- Sincronización determinista - siempre se puede regenerar desde el campo notes
- Compatible con edición manual en Google Tasks
- Evita complejidad de reconciliación de tasks con parent

### 5. Importación desde Google (googleTasksService.js líneas 364-524)

**Problema**: Al importar desde Google, se busca TaskList "por defecto" en lugar de mapear por proyecto

**Solución**:

- Obtener TODAS las TaskLists del usuario
- Por cada TaskList, buscar el proyecto correspondiente por `googleTaskListId`
- Si no existe proyecto, crearlo automáticamente
- Importar tareas de cada TaskList al proyecto correcto
- Para tareas con `parent`, agregarlas como subtareas (no crear tarea independiente)

### 6. Estado de Sincronización "syncing" sin timeout (línea 271)

**Problema**: Si falla la sync, las tareas quedan bloqueadas en estado "syncing"

**Solución**:

- Agregar timeout: si `syncStatus === 'syncing'` por más de 5 minutos, permitir reintentar
- Agregar timestamp `syncingStartedAt` para calcular timeout
- En el `pre('save')` middleware, verificar timeout antes de bloquear

### 7. Limpieza de código obsoleto

**Eliminar**:

- Función `buildTaskNotes()` - ya no agrega proyecto al título (líneas 753-775)
- Función `normalizeTitle()` - elimina prefijos que ya no usaremos (líneas 884-915)
- Función `isSpamTitle()` y `cleanSpamTitle()` - refactorizar a validación más simple
- Función `cleanDuplicatedNotes()` - no necesaria si no duplicamos info (líneas 798-831)
- Lógica de "Attadia Tasks" como lista por defecto (líneas 152-207)

### 8. Método fullSync() refactorizado (líneas 612-669)

**Nueva lógica**:

```
1. Sincronizar Proyectos ↔ TaskLists (bidireccional)
   - Proyectos locales sin googleTaskListId → crear TaskList en Google
   - Proyectos con cambios → actualizar TaskList en Google
   - TaskLists en Google sin proyecto local → crear proyecto en Attadia
   
2. Por cada proyecto/TaskList:
   - Sincronizar tareas del proyecto a su TaskList correspondiente
   - Importar tareas de la TaskList al proyecto correspondiente
   
3. Por cada tarea con subtareas:
   - Sincronizar subtareas como tasks con parent
   - Importar tasks con parent como subtareas
```

### 9. Actualizar métodos del modelo Proyectos

**Archivo**: apps/backend/src/models/Proyectos.js

Mejorar `toGoogleTaskListFormat()` (línea 113-118) para incluir todos los campos necesarios

Mejorar `updateFromGoogleTaskList()` (línea 122-136) para manejar cambios bidireccionales

## Archivos a Modificar

1. `apps/backend/src/models/Tareas.js` - Schema de subtareas
2. `apps/backend/src/models/Proyectos.js` - Métodos de conversión
3. `apps/backend/src/services/googleTasksService.js` - Toda la lógica de sincronización
4. `apps/backend/src/controllers/googleTasksController.js` - Mensajes y manejo de errores

## Flujo Correcto Final

### Sincronización Attadia → Google

```
1. Usuario crea Proyecto "Casa" en Attadia
   → Se crea TaskList "Casa" en Google
   → Se guarda googleTaskListId en proyecto.googleTasksSync

2. Usuario crea Tarea "Pintar paredes" en proyecto "Casa"
   → Se crea Task "Pintar paredes" en TaskList "Casa" de Google
   → Se guarda googleTaskId en tarea.googleTasksSync

3. Usuario agrega Subtarea "Comprar pintura"
   → Se crea Task "Comprar pintura" con parent=ID_de_"Pintar_paredes"
   → Se guarda googleTaskId en subtarea.googleTaskId
```

### Sincronización Google → Attadia

```
1. Usuario crea TaskList "Trabajo" en Google
   → Se crea Proyecto "Trabajo" en Attadia
   → Se guarda googleTaskListId

2. Usuario crea Task "Reunión" en TaskList "Trabajo"
   → Se crea Tarea "Reunión" en Proyecto "Trabajo" de Attadia
   → Se guarda googleTaskId

3. Usuario crea Task con parent (subtarea) en Google
   → Se agrega como subtarea al array de la tarea padre en Attadia
   → Se guarda googleTaskId en el subdocumento
```

### To-dos

- [ ] Agregar campos de sincronización (googleTaskId, googleTaskListId, lastSyncDate) al schema de subtareas en Tareas.js
- [ ] Refactorizar syncProyectosWithTaskLists() para crear/actualizar TaskLists reales en Google, una por proyecto
- [ ] Corregir syncTaskToGoogle() para usar el TaskList del proyecto en lugar de uno por defecto
- [ ] Implementar sincronización bidireccional de subtareas con almacenamiento de googleTaskId en subdocumentos
- [ ] Corregir syncTasksFromGoogle() para mapear TaskLists a proyectos correctamente y manejar tareas con parent como subtareas
- [ ] Agregar timeout de 5 minutos para el estado 'syncing' y timestamp syncingStartedAt
- [ ] Eliminar funciones obsoletas: normalizeTitle(), buildTaskNotes() con prefijos, cleanDuplicatedNotes(), isSpamTitle()
- [ ] Refactorizar fullSync() para implementar el flujo correcto: Proyectos↔TaskLists, luego Tareas↔Tasks por proyecto
- [ ] Mejorar toGoogleTaskListFormat() y updateFromGoogleTaskList() en modelo Proyectos
- [ ] Probar flujo completo de sincronización bidireccional y validar que no haya duplicados ni pérdida de datos