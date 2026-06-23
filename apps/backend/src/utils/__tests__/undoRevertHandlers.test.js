import { revertRutinaSectionUpdate } from '@shared/undo/undoRevertHandlers.js';

describe('undoRevertHandlers', () => {
  test('revertRutinaSectionUpdate restores previous value via context deps', async () => {
    const calls = [];

    const markItemComplete = jest.fn(async (rutinaId, section, itemData) => {
      calls.push(['mark', rutinaId, section, itemData]);
    });
    const patchRutinaSection = jest.fn((rutinaId, section, itemData) => {
      calls.push(['patch', rutinaId, section, itemData]);
    });

    const action = {
      entity: 'rutina_section',
      type: 'UPDATE',
      originalData: {
        rutinaId: 'r1',
        section: 'bodyCare',
        itemId: 'h1',
        value: false,
      },
    };

    await revertRutinaSectionUpdate(action, { markItemComplete, patchRutinaSection });

    expect(patchRutinaSection).toHaveBeenCalledWith('r1', 'bodyCare', { h1: false });
    expect(markItemComplete).toHaveBeenCalledWith('r1', 'bodyCare', { h1: false });
    expect(calls.length).toBe(2);
  });

  test('revertRutinaSectionUpdate handles undefined previous value', async () => {
    const patchRutinaSection = jest.fn();
    const markItemComplete = jest.fn();

    await revertRutinaSectionUpdate({
      originalData: {
        rutinaId: 'r1',
        section: 'nutricion',
        itemId: 'h2',
        value: undefined,
      },
    }, { markItemComplete, patchRutinaSection });

    expect(patchRutinaSection).toHaveBeenCalledWith('r1', 'nutricion', { h2: undefined });
  });
});
