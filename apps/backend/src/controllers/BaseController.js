import statusCache from '../utils/statusCache.js';

export class BaseController {
  constructor(Model, options = {}) {
    this.Model = Model;
    this.options = {
      searchFields: ['nombre', 'descripcion'],
      populate: [], // Array de configuraciones de populate
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

      // Agregar populate si está configurado
      if (this.options.populate && this.options.populate.length > 0) {
        options.populate = this.options.populate;
      }

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
      
      let queryExec = this.Model.find(query);
      
      // Agregar populate si está configurado
      if (this.options.populate && this.options.populate.length > 0) {
        this.options.populate.forEach(pop => {
          queryExec = queryExec.populate(pop);
        });
      }
      
      return queryExec
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
    let queryExec = this.Model.findById(req.params.id);
    
    // Manejar populate dinámico desde query params
    const { populate } = req.query;
    
    if (populate) {
      // Si se especifica populate en la query, usarlo
      const populateFields = populate.split(',');
      populateFields.forEach(field => {
        if (field === 'contratos') {
          // Populate especial para contratos con sus relaciones
          queryExec = queryExec.populate({
            path: 'contratos',
            populate: [
              'inquilino',
              'moneda',
              {
                path: 'cuenta',
                populate: {
                  path: 'moneda'
                }
              }
            ]
          });
        } else if (field === 'inquilinos') {
          queryExec = queryExec.populate({
            path: 'inquilinos',
            select: 'nombre apellido email telefono estado'
          });
        } else if (field === 'habitaciones') {
          queryExec = queryExec.populate({
            path: 'habitaciones',
            select: 'tipo nombrePersonalizado activo'
          });
        } else if (field === 'inventarios') {
          queryExec = queryExec.populate({
            path: 'inventarios',
            match: { activo: true },
            select: 'nombre descripcion activo'
          });
        } else if (field === 'cuenta') {
          queryExec = queryExec.populate({
            path: 'cuenta',
            populate: {
              path: 'moneda'
            }
          });
        } else if (field === 'moneda') {
          queryExec = queryExec.populate('moneda');
        } else {
          // Populate genérico para otros campos
          queryExec = queryExec.populate(field);
        }
      });
    } else {
      // Usar populate configurado por defecto
      if (this.options.populate && this.options.populate.length > 0) {
        this.options.populate.forEach(pop => {
          queryExec = queryExec.populate(pop);
        });
      }
    }
    
    return queryExec
      .then(item => {
        if (!item) {
          return res.status(404).json({ message: 'Recurso no encontrado' });
        }
        
        // Si se solicitaron contratos, procesarlos con el cache de estados
        if (populate && populate.includes('contratos') && item.contratos) {
          const contratosConEstado = statusCache.procesarContratos(item.contratos);
          item.contratos = contratosConEstado;
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