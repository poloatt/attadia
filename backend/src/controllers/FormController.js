import { BaseController } from './BaseController.js';
import mongoose from 'mongoose';

export class FormController extends BaseController {
  constructor(Model, options = {}) {
    super(Model, options);
    
    this.nestedFields = options.nestedFields || {};
    this.validations = options.validations || {};
    this.transformations = options.transformations || {};
  }

  // POST /api/forms/:formType/validate
  async validateField(req, res) {
    try {
      const { formType, fieldName } = req.params;
      const { value, formData } = req.body;

      const validation = this.validations[formType]?.[fieldName];
      if (!validation) {
        return res.json({ isValid: true });
      }

      const result = await validation(value, formData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/forms/:formType/nested
  async createNested(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { formType, parentField } = req.params;
      const { data } = req.body;

      const nestedConfig = this.nestedFields[formType]?.[parentField];
      if (!nestedConfig) {
        throw new Error('Configuración de campo anidado no encontrada');
      }

      // Crear el registro anidado
      const NestedModel = nestedConfig.model;
      const transformedData = nestedConfig.transform ? 
        await nestedConfig.transform(data, req.user) : 
        data;

      const nestedDoc = new NestedModel({
        ...transformedData,
        usuario: req.user.id
      });

      await nestedDoc.save({ session });

      // Si hay más campos anidados, procesarlos recursivamente
      if (data._nested) {
        for (const [field, nestedData] of Object.entries(data._nested)) {
          const childConfig = this.nestedFields[formType]?.[field];
          if (childConfig) {
            const childDoc = await this.createNestedField(
              childConfig,
              nestedData,
              req.user,
              session
            );
            nestedDoc[field] = childDoc._id;
          }
        }
        await nestedDoc.save({ session });
      }

      await session.commitTransaction();
      res.status(201).json(nestedDoc);
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ error: error.message });
    } finally {
      session.endSession();
    }
  }

  // Método auxiliar para crear campos anidados recursivamente
  async createNestedField(config, data, user, session) {
    const Model = config.model;
    const transformedData = config.transform ? 
      await config.transform(data, user) : 
      data;

    const doc = new Model({
      ...transformedData,
      usuario: user.id
    });

    await doc.save({ session });
    return doc;
  }

  // GET /api/forms/:formType/fields
  async getFormFields(req, res) {
    try {
      const { formType } = req.params;
      const fields = await this.getFieldsConfig(formType, req.user);
      res.json(fields);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Método para obtener la configuración de campos
  async getFieldsConfig(formType, user) {
    // Implementar lógica para obtener configuración de campos
    // basada en el tipo de formulario y permisos del usuario
    return {};
  }
} 