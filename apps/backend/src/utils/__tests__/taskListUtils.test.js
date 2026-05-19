import { dedupeSerieTasksForList } from '../../../../shared/utils/taskListUtils.js';

describe('dedupeSerieTasksForList', () => {
  test('keeps all virtual occurrences for the same serie', () => {
    const tasks = [
      {
        _id: 'virtual:serie1:2026-05-14',
        serieId: 'serie1',
        virtual: true,
        fechaInicio: new Date(2026, 4, 14, 12, 0, 0),
        fechaVencimiento: new Date(2026, 4, 14, 12, 0, 0),
      },
      {
        _id: 'virtual:serie1:2026-05-21',
        serieId: 'serie1',
        virtual: true,
        fechaInicio: new Date(2026, 4, 21, 12, 0, 0),
        fechaVencimiento: new Date(2026, 4, 21, 12, 0, 0),
      },
      {
        _id: 'virtual:serie1:2026-05-28',
        serieId: 'serie1',
        virtual: true,
        fechaInicio: new Date(2026, 4, 28, 12, 0, 0),
        fechaVencimiento: new Date(2026, 4, 28, 12, 0, 0),
      },
    ];

    const result = dedupeSerieTasksForList(tasks);
    expect(result).toHaveLength(3);
  });

  test('keeps Google anchor and drops other materialized rows for the serie', () => {
    const anchor = {
      _id: 'anchor1',
      serieId: 'serie1',
      fechaInicio: new Date(2026, 4, 21, 12, 0, 0),
      googleTasksSync: { googleTaskId: 'gt-1' },
    };
    const duplicate = {
      _id: 'mat2',
      serieId: 'serie1',
      fechaInicio: new Date(2026, 4, 14, 12, 0, 0),
    };

    const result = dedupeSerieTasksForList([anchor, duplicate]);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('anchor1');
  });
});
