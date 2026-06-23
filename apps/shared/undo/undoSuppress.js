/**
 * Evita registrar acciones en el historial durante una reversión (undo).
 */
let suppressed = false;

export function isUndoRecordingSuppressed() {
  return suppressed;
}

export async function runWithoutUndoRecording(fn) {
  suppressed = true;
  try {
    return await fn();
  } finally {
    suppressed = false;
  }
}
