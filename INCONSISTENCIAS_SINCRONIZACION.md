# Inconsistencias de Sincronización entre Componentes

## Resumen
Se identificaron varias inconsistencias en la sincronización entre `RutinaCard`, `RutinasPendientesHoy`, `RutinasLuego`, y `ChecklistItem` relacionadas con el manejo del estado de completitud de hábitos con múltiples horarios.

---

## 1. ChecklistItem no tiene acceso a localData

**Ubicación**: `apps/foco/src/rutinas/ChecklistItem.jsx:94-106`

**Problema**: 
- `ChecklistItem` usa solo `rutina?.[section]?.[itemId]` del contexto para verificar el estado de completitud
- `RutinaCard` mantiene `localData` para actualizaciones optimistas
- Cuando `RutinaCard` actualiza `localData`, `ChecklistItem` no refleja el cambio hasta que el contexto se actualiza

**Código afectado**:
```javascript
const isHorarioCompleted = (horario) => {
  // Nota: ChecklistItem no tiene acceso directo a localData, así que usamos rutina
  const itemValue = rutina?.[section]?.[itemId];
  // ...
}
```

**Impacto**: Los iconos de horario en `ChecklistItem` pueden no reflejar actualizaciones optimistas inmediatas.

---

## 2. Comparación incorrecta de objetos en RutinaCard

**Ubicación**: `apps/foco/src/rutinas/RutinaCard.jsx:553`

**Problema**:
- Se compara `valorServidor !== newValue` pero si son objetos, esta comparación siempre será `true` aunque tengan el mismo contenido
- Esto puede causar actualizaciones innecesarias del estado local

**Código afectado**:
```javascript
if (valorServidor !== newValue) {
  // Actualizar estado local con valor del servidor
  setLocalData(prevData => ({
    ...prevData,
    [itemId]: valorServidor
  }));
}
```

**Impacto**: Actualizaciones innecesarias del estado cuando los objetos tienen el mismo contenido pero diferentes referencias.

**Solución sugerida**: Usar comparación profunda o `JSON.stringify()` para objetos.

---

## 3. Sincronización entre RutinasPendientesHoy/RutinasLuego y RutinaCard

**Ubicación**: 
- `apps/foco/src/rutinas/RutinasPendientesHoy.jsx:332-389`
- `apps/foco/src/rutinas/RutinasLuego.jsx:279-336`
- `apps/foco/src/rutinas/RutinaCard.jsx:116`

**Problema**:
- `RutinasPendientesHoy` y `RutinasLuego` llaman a `markItemComplete` que actualiza el contexto
- `RutinaCard` mantiene su propio `localData` que se actualiza solo cuando se hace clic desde `RutinaCard`
- Si se marca un item desde `RutinasPendientesHoy` o `RutinasLuego`, `RutinaCard` no actualiza su `localData` hasta que se recarga la rutina

**Impacto**: 
- `RutinaCard` puede mostrar datos desactualizados temporalmente
- Los iconos en la vista colapsada pueden no reflejar cambios hechos desde otros componentes

**Solución sugerida**: 
- Sincronizar `localData` cuando `rutina` cambia desde el contexto
- O usar un evento personalizado para notificar cambios

---

## 4. Verificación de completado inconsistente

**Ubicación**: Múltiples archivos

**Problema**: Diferentes componentes usan diferentes métodos para verificar si un item está completado:

1. **RutinaCard** (`isItemCompleted`):
   - Prioriza `localData[itemId]` sobre `rutina?.[section]?.[itemId]`
   - Soporta formato objeto y boolean

2. **RutinasPendientesHoy** (línea 152-160):
   - Usa directamente `rutinaHoy?.[section]?.[itemId]`
   - Verifica formato objeto con `Object.values(itemValue).every(Boolean)`

3. **ChecklistItem** (`isHorarioCompleted`):
   - Usa solo `rutina?.[section]?.[itemId]`
   - No tiene acceso a `localData`

**Impacto**: Diferentes componentes pueden mostrar estados diferentes para el mismo item.

**Solución sugerida**: Centralizar la lógica de verificación de completitud en una función utilitaria compartida.

---

## 5. Verificación de completado en renderCollapsedIcons

**Ubicación**: `apps/foco/src/rutinas/RutinaCard.jsx:286-288`

**Problema**:
- Usa `Object.values(itemValue).some(Boolean)` para verificar si está completado
- Esto es diferente de `isItemCompleted` que puede verificar un horario específico

**Código afectado**:
```javascript
const isCompletedIcon = isObjectFormat 
  ? Object.values(itemValue).some(Boolean) 
  : (itemValue === true);
```

**Impacto**: La vista colapsada puede mostrar items como completados cuando solo algunos horarios están completados.

---

## 6. Falta de sincronización cuando se colapsa/expande

**Ubicación**: `apps/foco/src/rutinas/RutinaCard.jsx:193-207`

**Problema**:
- Cuando se colapsa la sección, se limpia `focusedItemId`
- Pero no se sincroniza `localData` con `rutina` del contexto
- Si hubo cambios desde otros componentes, `localData` puede estar desactualizado

**Impacto**: Al expandir nuevamente, puede mostrar datos desactualizados.

---

## Recomendaciones

1. **Centralizar lógica de verificación de completitud**: Crear una función utilitaria compartida que maneje tanto formato objeto como boolean, con soporte para `localData` y `rutina`.

2. **Sincronizar localData con rutina**: Agregar un `useEffect` en `RutinaCard` que sincronice `localData` cuando `rutina` cambia desde el contexto.

3. **Mejorar comparación de objetos**: Usar comparación profunda o `JSON.stringify()` para comparar objetos en `RutinaCard`.

4. **Pasar localData a ChecklistItem**: Modificar `ChecklistItem` para aceptar `localData` como prop opcional, o usar el contexto para acceder a actualizaciones optimistas.

5. **Eventos personalizados para sincronización**: Considerar usar eventos personalizados para notificar cambios entre componentes cuando sea necesario.

