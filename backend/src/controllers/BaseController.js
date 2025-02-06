class BaseController {
  constructor(Model, options = {}) {
    this.Model = Model;
    this.options = {
      searchFields: ['nombre', 'descripcion'],
      ...options
    };
  }

  // GET /api/resource
  getAll = async (req, res) => {
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

      // Aplicar búsqueda si existe
      if (search) {
        query.$or = this.options.searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' }
        }));
      }

      // Aplicar filtros adicionales
      if (filter) {
        Object.assign(query, JSON.parse(filter));
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        select
      };

      const result = await this.Model.paginate(query, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // GET /api/resource/select-options
  getSelectOptions = async (req, res) => {
    try {
      const { filter } = req.query;
      const query = filter ? JSON.parse(filter) : { activo: true };
      
      const items = await this.Model.find(query);
      const options = items.map(item => item.toSelectOption());
      
      res.json(options);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // GET /api/resource/:id
  getById = async (req, res) => {
    try {
      const item = await this.Model.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Recurso no encontrado' });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // POST /api/resource
  create = async (req, res) => {
    try {
      const item = new this.Model(req.body);
      await item.save();
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // PUT /api/resource/:id
  update = async (req, res) => {
    try {
      const item = await this.Model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!item) {
        return res.status(404).json({ message: 'Recurso no encontrado' });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // DELETE /api/resource/:id
  delete = async (req, res) => {
    try {
      const item = await this.Model.findByIdAndDelete(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Recurso no encontrado' });
      }
      res.json({ message: 'Recurso eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // PATCH /api/resource/:id/toggle-active
  toggleActive = async (req, res) => {
    try {
      const item = await this.Model.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Recurso no encontrado' });
      }
      
      item.activo = !item.activo;
      await item.save();
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
} 