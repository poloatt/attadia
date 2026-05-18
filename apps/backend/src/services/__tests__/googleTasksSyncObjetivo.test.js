/**
 * Valida contrato de sync post-migración Objetivo ↔ Google Task List
 */
import { jest } from '@jest/globals';

const mockTasklistsInsert = jest.fn();
const mockTasklistsGet = jest.fn();
const mockTasklistsUpdate = jest.fn();
const mockTasksInsert = jest.fn();
const mockTasklistsList = jest.fn();

jest.unstable_mockModule('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class OAuth2 {
        setCredentials() {}
        on() { return this; }
        getAccessToken() { return Promise.resolve({ token: 'tok' }); }
      }
    },
    tasks: () => ({
      tasklists: {
        list: mockTasklistsList,
        get: mockTasklistsGet,
        insert: mockTasklistsInsert,
        update: mockTasklistsUpdate
      },
      tasks: {
        list: jest.fn().mockResolvedValue({ data: { items: [] } }),
        insert: mockTasksInsert,
        patch: jest.fn(),
        get: jest.fn(),
        delete: jest.fn()
      }
    })
  }
}));

const objetivoSave = jest.fn().mockResolvedValue(undefined);
const ObjetivosFind = jest.fn();
const ObjetivosFindOne = jest.fn();
const TareasFind = jest.fn();
const TareasFindById = jest.fn();
const TareasUpdateMany = jest.fn();

jest.unstable_mockModule('../../models/index.js', () => ({
  Users: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue({})
  },
  Tareas: {
    find: TareasFind,
    findOne: jest.fn(),
    findById: TareasFindById,
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    findByIdAndDelete: jest.fn(),
    updateMany: TareasUpdateMany
  },
  Objetivos: {
    find: ObjetivosFind,
    findOne: ObjetivosFindOne
  }
}));

jest.unstable_mockModule('../../config/config.js', () => ({
  default: {
    google: { clientId: 'id', clientSecret: 'secret' },
    backendUrl: 'http://localhost:5000'
  }
}));

jest.unstable_mockModule('../../utils/logger.js', () => ({
  default: {
    sync: jest.fn(),
    dev: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { default: googleTasksService } = await import('../googleTasksService.js');
const { Users } = await import('../../models/index.js');

const userId = '507f1f77bcf86cd799439011';
const objetivoId = '607f1f77bcf86cd799439012';

function makeObjetivo(overrides = {}) {
  return {
    _id: objetivoId,
    nombre: 'Salud',
    usuario: userId,
    googleTasksSync: { googleTaskListId: null, enabled: false },
    save: objetivoSave,
    ...overrides
  };
}

function makeUser() {
  return {
    _id: userId,
    id: userId,
    googleTasksConfig: {
      enabled: true,
      accessToken: 'at',
      refreshToken: 'rt',
      lastSync: new Date('2020-01-01')
    }
  };
}

describe('Google Tasks sync — Objetivo ↔ Lista', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Users.findById.mockResolvedValue(makeUser());
    googleTasksService.oauthClients = new Map();
    googleTasksService.tasksClients = new Map();

    mockTasklistsList.mockResolvedValue({ data: { items: [] } });
    mockTasklistsInsert.mockResolvedValue({
      data: { id: 'lista-google-1', title: 'Salud', etag: 'e1', selfLink: 'http://x' }
    });
    mockTasklistsGet.mockResolvedValue({
      data: { id: 'lista-google-1', title: 'Salud', etag: 'e1' }
    });
    mockTasklistsUpdate.mockResolvedValue({ data: {} });
    TareasUpdateMany.mockResolvedValue({ modifiedCount: 0 });
    TareasFind.mockResolvedValue([]);
  });

  test('syncObjetivosWithTaskLists crea lista Google y persiste googleTaskListId', async () => {
    const objetivo = makeObjetivo();
    ObjetivosFind.mockResolvedValue([objetivo]);
    mockTasklistsList.mockResolvedValue({ data: { items: [] } });

    const result = await googleTasksService.syncObjetivosWithTaskLists(userId);

    expect(result.created).toBe(1);
    expect(result.linked).toBe(0);
    expect(mockTasklistsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ requestBody: { title: 'Salud' } })
    );
    expect(objetivoSave).toHaveBeenCalled();
    expect(objetivo.googleTasksSync.googleTaskListId).toBe('lista-google-1');
    expect(TareasUpdateMany).toHaveBeenCalled();
  });

  test('syncObjetivosWithTaskLists vincula lista Google existente por nombre sin insert', async () => {
    const objetivo = makeObjetivo();
    ObjetivosFind.mockResolvedValue([objetivo]);
    mockTasklistsList.mockResolvedValue({
      data: {
        items: [{ id: 'lista-existente', title: 'Salud', etag: 'e0', selfLink: 'http://y' }],
      },
    });

    const result = await googleTasksService.syncObjetivosWithTaskLists(userId);

    expect(result.linked).toBe(1);
    expect(result.created).toBe(0);
    expect(mockTasklistsInsert).not.toHaveBeenCalled();
    expect(objetivo.googleTasksSync.googleTaskListId).toBe('lista-existente');
  });

  test('syncTaskToGoogle exige tarea.objetivo', async () => {
    TareasFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 't1',
        titulo: 'Tarea',
        objetivo: null,
        save: jest.fn(),
        toGoogleTaskFormat: () => ({ title: 'Tarea', status: 'needsAction' })
      })
    });

    await expect(googleTasksService.syncTaskToGoogle('t1', userId)).rejects.toThrow(
      /objetivo/i
    );
  });

  test('ensureTaskListAccessible(objetivo) reutiliza googleTaskListId del objetivo', async () => {
    const objetivo = makeObjetivo({
      googleTasksSync: { googleTaskListId: 'lista-existente', enabled: true }
    });

    const listId = await googleTasksService.ensureTaskListAccessible(objetivo, userId);

    expect(listId).toBe('lista-existente');
    expect(mockTasklistsGet).toHaveBeenCalled();
    expect(mockTasklistsInsert).not.toHaveBeenCalled();
  });

  test('fullSyncWithUser expone results.objetivos para el frontend', async () => {
    jest.spyOn(googleTasksService, 'syncObjetivosWithTaskLists').mockResolvedValue({
      created: 1,
      updated: 0,
      errors: []
    });
    jest.spyOn(googleTasksService, 'syncTasksFromGoogle').mockResolvedValue({
      created: 2,
      updated: 1,
      errors: [],
      skipped: 0
    });
    jest.spyOn(googleTasksService, 'syncTaskToGoogle').mockResolvedValue(undefined);

    TareasFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      })
    });

    const results = await googleTasksService.fullSyncWithUser(makeUser());

    expect(results.objetivos).toEqual({ created: 1, updated: 0, errors: [] });
    expect(results.tareas.fromGoogle.created).toBe(2);
    expect(results.proyectos).toBeUndefined();

    googleTasksService.syncObjetivosWithTaskLists.mockRestore();
    googleTasksService.syncTasksFromGoogle.mockRestore();
    googleTasksService.syncTaskToGoogle.mockRestore();
  });
});
