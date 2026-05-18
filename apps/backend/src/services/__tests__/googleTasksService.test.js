import googleTasksService from '../googleTasksService.js';

describe('googleTasksService helpers', () => {
  test('cleanTitle removes bracket prefixes and collapses spaces', () => {
    const cases = [
      ['[Salud] Turno dentista', 'Turno dentista'],
      ['  [Mis tareas]   Sacar   Basura  ', 'Sacar Basura'],
      ['[A][B]   X', 'X'],
      ['', 'Tarea importada']
    ];
    for (const [input, expected] of cases) {
      expect(googleTasksService.cleanTitle(input)).toBe(expected);
    }
  });

  test('normalizeTitleStrong removes diacritics and brackets, lowercase, collapse spaces', () => {
    const input = '  [Trámites]  Adjuntar   pDF  ';
    const norm = googleTasksService.normalizeTitleStrong(input);
    expect(norm).toBe('adjuntar pdf');
  });

  test('equalsForPatch matches only on relevant fields', () => {
    const remote = { title: 'Tarea', status: 'needsAction', notes: 'abc', updated: 'ignored' };
    const same = { title: 'Tarea', status: 'needsAction', notes: 'abc', parent: 'ignored' };
    const different = { title: 'Tarea!', status: 'needsAction', notes: 'abc' };
    expect(googleTasksService.equalsForPatch(remote, same)).toBe(true);
    expect(googleTasksService.equalsForPatch(remote, different)).toBe(false);
  });

  test('parseSubtasksFromNotes extracts description and subtareas with checkboxes', () => {
    const notes = `Descripción de la tarea

Subtareas:
☐ Pendiente uno
☑ Hecho dos
○ Legacy pendiente
✓ Legacy hecho`;

    const { descripcion, subtareas } = googleTasksService.parseSubtasksFromNotes(notes);
    expect(descripcion).toBe('Descripción de la tarea');
    expect(subtareas).toHaveLength(4);
    expect(subtareas[0]).toEqual({ titulo: 'Pendiente uno', completada: false });
    expect(subtareas[1]).toEqual({ titulo: 'Hecho dos', completada: true });
    expect(subtareas[2].completada).toBe(false);
    expect(subtareas[3].completada).toBe(true);
  });

  test('buildTaskNotes does not duplicate Subtareas block from descripcion', () => {
    const tarea = {
      descripcion: 'Mi descripción\n\nSubtareas:\n☐ Vieja',
      subtareas: [{ titulo: 'Nueva', completada: false }]
    };
    const notes = googleTasksService.buildTaskNotes(tarea);
    expect(notes.match(/Subtareas:/g)).toHaveLength(1);
    expect(notes).toContain('☐ Nueva');
    expect(notes).toContain('Mi descripción');
  });

  test('shouldApplyGoogleUpdate respects needsSync and timestamps', () => {
    const googleTask = { updated: '2026-05-18T12:00:00.000Z' };

    const pendingLocal = {
      updatedAt: new Date('2026-05-18T13:00:00.000Z'),
      googleTasksSync: { needsSync: true, syncStatus: 'pending' }
    };
    expect(googleTasksService.shouldApplyGoogleUpdate(pendingLocal, googleTask)).toBe(false);

    const staleLocal = {
      updatedAt: new Date('2026-05-18T10:00:00.000Z'),
      googleTasksSync: { needsSync: false, syncStatus: 'synced', updated: new Date('2026-05-18T10:00:00.000Z') }
    };
    expect(googleTasksService.shouldApplyGoogleUpdate(staleLocal, googleTask)).toBe(true);

    const freshLocal = {
      updatedAt: new Date('2026-05-18T14:00:00.000Z'),
      googleTasksSync: { needsSync: false, syncStatus: 'synced', updated: new Date('2026-05-18T14:00:00.000Z') }
    };
    expect(googleTasksService.shouldApplyGoogleUpdate(freshLocal, googleTask)).toBe(false);
  });
});
