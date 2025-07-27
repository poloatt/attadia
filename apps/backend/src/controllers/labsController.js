import { BaseController } from './BaseController.js';
import { Labs } from '../models/Labs.js';

class LabsController extends BaseController {
  constructor() {
    super(Labs, {
      searchFields: ['tipo', 'notas']
    });
  }
}

export const labsController = new LabsController();