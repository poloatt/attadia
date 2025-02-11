export class BaseController {
  constructor(Model, options = {}) {
    this.Model = Model;
    this.options = {
      searchFields: ['nombre', 'descripcion'],
      ...options
    };

    // Bind de los métodos al contexto de la instancia
    this.getAll = this.getAll.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.toggleActive = this.toggleActive.bind(this);

    // Log para verificar la estructura de la clase base
    console.log('BaseController methods:', {
      getAll: typeof this.getAll,
      getSelectOptions: typeof this.getSelectOptions,
      getById: typeof this.getById,
      create: typeof this.create,
      update: typeof this.update,
      delete: typeof this.delete,
      toggleActive: typeof this.toggleActive
    });
  }

  // GET /api/resource
  getAll(req, res) {
    console.log('BaseController.getAll called');
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = '-createdAt',
        search,
        filter,
        select
      } = req.query;

      const query = {};

      if (search) {
        query.$or = this.options.searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' }
        }));
      }

      if (filter) {
        Object.assign(query, JSON.parse(filter));
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        select
      };

      return this.Model.paginate(query, options)
        .then(result => res.json(result))
        .catch(error => {
          console.error('Error en getAll:', error);
          res.status(500).json({ error: error.message });
        });
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/resource/select-options
  getSelectOptions(req, res) {
    console.log('BaseController.getSelectOptions called');
    try {
      const { filter } = req.query;
      const query = filter ? JSON.parse(filter) : { activo: true };
      
      return this.Model.find(query)
        .then(items => {
          const options = items.map(item => item.toSelectOption());
          res.json(options);
        })
        .catch(error => {
          console.error('Error en getSelectOptions:', error);
          res.status(500).json({ error: error.message });
        });
    } catch (error) {
      console.error('Error en getSelectOptions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/resource/:id
  getById(req, res) {
    console.log('BaseController.getById called');
    return this.Model.findById(req.params.id)
      .then(item => {
        if (!item) {
          return res.status(404).json({ message: 'Recurso no encontrado' });
        }
        res.json(item);
      })
      .catch(error => {
        console.error('Error en getById:', error);
        res.status(500).json({ error: error.message });
      });
  }

  // POST /api/resource
  create(req, res) {
    console.log('BaseController.create called');
    const item = new this.Model(req.body);
    return item.save()
      .then(savedItem => res.status(201).json(savedItem))
      .catch(error => {
        console.error('Error en create:', error);
        res.status(400).json({ error: error.message });
      });
  }

  // PUT /api/resource/:id
  update(req, res) {
    console.log('BaseController.update called');
    return this.Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .then(item => {
        if (!item) {
          return res.status(404).json({ message: 'Recurso no encontrado' });
        }
        res.json(item);
      })
      .catch(error => {
        console.error('Error en update:', error);
        res.status(400).json({ error: error.message });
      });
  }

  // DELETE /api/resource/:id
  delete(req, res) {
    console.log('BaseController.delete called');
    return this.Model.findByIdAndDelete(req.params.id)
      .then(item => {
        if (!item) {
          return res.status(404).json({ message: 'Recurso no encontrado' });
        }
        res.json({ message: 'Recurso eliminado correctamente' });
      })
      .catch(error => {
        console.error('Error en delete:', error);
        res.status(500).json({ error: error.message });
      });
  }

  // PATCH /api/resource/:id/toggle-active
  toggleActive(req, res) {
    console.log('BaseController.toggleActive called');
    return this.Model.findById(req.params.id)
      .then(item => {
        if (!item) {
          return res.status(404).json({ message: 'Recurso no encontrado' });
        }
        item.activo = !item.activo;
        return item.save();
      })
      .then(updatedItem => res.json(updatedItem))
      .catch(error => {
        console.error('Error en toggleActive:', error);
        res.status(500).json({ error: error.message });
      });
  }
} 