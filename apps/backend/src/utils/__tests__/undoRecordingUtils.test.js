import { recordRutinaSectionDiff } from '@shared/undo/undoRecordingUtils.js';
import { ACTION_TYPES } from '@shared/constants/actionHistoryTypes.js';

describe('undoRecordingUtils', () => {
  test('recordRutinaSectionDiff registers only changed items', () => {
    const actions = [];
    const recorder = {
      isActive: true,
      addScopedAction: (action) => actions.push(action),
    };

    recordRutinaSectionDiff(
      recorder,
      'r1',
      'bodyCare',
      { a: false, b: true },
      { a: true, b: true },
    );

    expect(actions).toHaveLength(1);
    expect(actions[0].entity).toBe('rutina_section');
    expect(actions[0].data.itemId).toBe('a');
    expect(actions[0].data.value).toBe(true);
    expect(actions[0].originalData.value).toBe(false);
  });
});
