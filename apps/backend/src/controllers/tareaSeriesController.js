import { TareaSeries, Tareas, Objetivos } from '../models/index.js';
import { appendRecurrenceToNotes } from '../utils/recurrenceUtils.js';
import { buildGoogleSerieKey } from '../utils/recurrenceUtils.js';

export const createSerie = async (req, res) => {
  try {
    const userId = req.user.id;
    const { titulo, descripcion, objetivo, rrule, dtstart, timezone, hasta, count, primeraInstancia } = req.body;

    if (!titulo || !objetivo || !rrule) {
      return res.status(400).json({ error: 'titulo, objetivo y rrule son requeridos' });
    }

    const objetivoDoc = await Objetivos.findOne({ _id: objetivo, usuario: userId });
    if (!objetivoDoc) {
      return res.status(404).json({ error: 'Objetivo no encontrado' });
    }

    const taskListId = objetivoDoc.googleTasksSync?.googleTaskListId || null;
    const googleSerieKey = buildGoogleSerieKey(taskListId, titulo);
    const start = dtstart ? new Date(dtstart) : new Date();

    const serie = new TareaSeries({
      titulo,
      descripcion: descripcion || '',
      usuario: userId,
      objetivo,
      rrule: rrule.replace(/^RRULE:/, ''),
      dtstart: start,
      timezone: timezone || 'America/Argentina/Buenos_Aires',
      hasta: hasta ? new Date(hasta) : undefined,
      count,
      googleSerieKey,
      googleTasksSync: {
        enabled: true,
        googleTaskListId: taskListId,
        exportInstances: true,
      },
    });

    await serie.save();

    const inst = primeraInstancia || {};
    const occDate = inst.fechaInicio ? new Date(inst.fechaInicio) : start;
    const tarea = new Tareas({
      titulo,
      descripcion: appendRecurrenceToNotes(descripcion || '', serie.rrule),
      usuario: userId,
      objetivo,
      serieId: serie._id,
      fechaInicio: occDate,
      fechaVencimiento: inst.fechaVencimiento ? new Date(inst.fechaVencimiento) : occDate,
      prioridad: inst.prioridad || 'BAJA',
      tipo: inst.tipo === 'EVENTO' ? 'EVENTO' : 'TAREA',
      googleTasksSync: {
        enabled: true,
        syncStatus: 'pending',
        needsSync: true,
        googleTaskListId: taskListId,
      },
    });

    await tarea.save();

    res.status(201).json({ serie, primeraInstancia: tarea });
  } catch (error) {
    console.error('Error al crear serie:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSerie = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rrule, titulo, descripcion, activa, dtstart, hasta, count, regenerarFuturas } = req.body;

    const serie = await TareaSeries.findOne({ _id: id, usuario: userId });
    if (!serie) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }

    if (rrule) serie.rrule = rrule.replace(/^RRULE:/, '');
    if (titulo) serie.titulo = titulo;
    if (descripcion !== undefined) serie.descripcion = descripcion;
    if (activa !== undefined) serie.activa = activa;
    if (dtstart) serie.dtstart = new Date(dtstart);
    if (hasta !== undefined) serie.hasta = hasta ? new Date(hasta) : null;
    if (count !== undefined) serie.count = count;

    await serie.save();

    if (regenerarFuturas) {
      const now = new Date();
      await Tareas.deleteMany({
        usuario: userId,
        serieId: serie._id,
        estado: 'PENDIENTE',
        completada: false,
        fechaInicio: { $gte: now },
      });
    }

    res.json({ serie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSerie = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { soloFuturas } = req.query;

    const serie = await TareaSeries.findOne({ _id: id, usuario: userId });
    if (!serie) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }

    const now = new Date();
    if (soloFuturas === 'true') {
      await Tareas.deleteMany({
        usuario: userId,
        serieId: serie._id,
        estado: 'PENDIENTE',
        fechaInicio: { $gte: now },
      });
    } else {
      await Tareas.deleteMany({ usuario: userId, serieId: serie._id });
    }

    serie.activa = false;
    await serie.save();

    res.json({ message: 'Serie desactivada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSerie = async (req, res) => {
  try {
    const serie = await TareaSeries.findOne({
      _id: req.params.id,
      usuario: req.user.id,
    }).populate('objetivo', 'nombre');

    if (!serie) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }

    res.json(serie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
