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
});


