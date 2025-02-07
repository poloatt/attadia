import { BaseController } from './BaseController.js';
import { Monedas } from '../models/index.js';

class MonedasController extends BaseController {
  constructor() {
    super(Monedas, {
      searchFields: ['codigo', 'nombre', 'simbolo']
    });

    // Bind de los métodos al contexto de la instancia
    this.getByCode = this.getByCode.bind(this);
    this.getActive = this.getActive.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);

    // Log para verificar la estructura del controlador
    console.log('MonedasController methods:', {
      getByCode: typeof this.getByCode,
      getActive: typeof this.getActive,
      getAll: typeof this.getAll,
      getById: typeof this.getById,
      create: typeof this.create,
      update: typeof this.update,
      delete: typeof this.delete,
      toggleActive: typeof this.toggleActive,
      getSelectOptions: typeof this.getSelectOptions
    });
  }

  // GET /api/monedas/by-code/:codigo
  getByCode(req, res) {
    console.log('MonedasController.getByCode called');
    return this.Model.findOne({ 
      codigo: req.params.codigo.toUpperCase(),
      activo: true
    })
      .then(moneda => {
        if (!moneda) {
          return res.status(404).json({ message: 'Moneda no encontrada' });
        }
        res.json(moneda);
      })
      .catch(error => {
        console.error('Error en getByCode:', error);
        res.status(500).json({ error: error.message });
      });
  }

  // GET /api/monedas/active
  getActive(req, res) {
    console.log('MonedasController.getActive called');
    return this.Model.find({ activo: true })
      .sort('codigo')
      .then(monedas => res.json(monedas))
      .catch(error => {
        console.error('Error en getActive:', error);
        res.status(500).json({ error: error.message });
      });
  }

  // Sobrescribir create para manejar validaciones específicas
  create(req, res) {
    console.log('MonedasController.create called');
    const { codigo } = req.body;
    
    return this.Model.findOne({ codigo: codigo.toUpperCase() })
      .then(existingMoneda => {
        if (existingMoneda) {
          return res.status(400).json({ 
            message: 'Ya existe una moneda con ese código' 
          });
        }

        const moneda = new this.Model({
          ...req.body,
          codigo: codigo.toUpperCase()
        });
        
        return moneda.save()
          .then(savedMoneda => res.status(201).json(savedMoneda))
          .catch(error => {
            console.error('Error al guardar moneda:', error);
            res.status(400).json({ error: error.message });
          });
      })
      .catch(error => {
        console.error('Error en create:', error);
        res.status(400).json({ error: error.message });
      });
  }

  // Sobrescribir update para manejar validaciones específicas
  update(req, res) {
    console.log('MonedasController.update called');
    const { codigo } = req.body;
    
    if (codigo) {
      return this.Model.findOne({
        codigo: codigo.toUpperCase(),
        _id: { $ne: req.params.id }
      })
        .then(existingMoneda => {
          if (existingMoneda) {
            return res.status(400).json({
              message: 'Ya existe una moneda con ese código'
            });
          }

          req.body.codigo = codigo.toUpperCase();
          return this.Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
          )
            .then(moneda => {
              if (!moneda) {
                return res.status(404).json({ message: 'Moneda no encontrada' });
              }
              res.json(moneda);
            });
        })
        .catch(error => {
          console.error('Error en update:', error);
          res.status(400).json({ error: error.message });
        });
    }

    return this.Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .then(moneda => {
        if (!moneda) {
          return res.status(404).json({ message: 'Moneda no encontrada' });
        }
        res.json(moneda);
      })
      .catch(error => {
        console.error('Error en update:', error);
        res.status(400).json({ error: error.message });
      });
  }
}

const monedasController = new MonedasController();
console.log('Exported monedasController:', monedasController);
export { monedasController }; 