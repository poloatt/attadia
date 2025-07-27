import mongoose from 'mongoose';
import { Contratos } from '../models/index.js';
import config from '../config/config.js';

async function updateContractStates() {
  try {
    // Conectar a la base de datos
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://admin:MiContraseñaSegura123@localhost:27017/present?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('Conectado a MongoDB');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Obtener todos los contratos
    const contratos = await Contratos.find({});
    console.log(`Procesando ${contratos.length} contratos...`);

    let actualizados = 0;

    for (const contrato of contratos) {
      const inicio = new Date(contrato.fechaInicio);
      const fin = new Date(contrato.fechaFin);
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(0, 0, 0, 0);

      let nuevoEstado;

      if (contrato.esMantenimiento || contrato.tipoContrato === 'MANTENIMIENTO') {
        if (inicio <= now && fin > now) {
          nuevoEstado = 'MANTENIMIENTO';
        } else if (inicio > now) {
          nuevoEstado = 'PLANEADO';
        } else {
          nuevoEstado = 'FINALIZADO';
        }
      } else {
        if (inicio <= now && fin > now) {
          nuevoEstado = 'ACTIVO';
        } else if (inicio > now) {
          nuevoEstado = 'PLANEADO';
        } else {
          nuevoEstado = 'FINALIZADO';
        }
      }

      // Solo actualizar si el estado cambió
      if (contrato.estado !== nuevoEstado) {
        console.log(`Actualizando contrato ${contrato._id}: ${contrato.estado || 'SIN_ESTADO'} -> ${nuevoEstado}`);
        await Contratos.findByIdAndUpdate(contrato._id, { estado: nuevoEstado });
        actualizados++;
      }
    }

    console.log(`Actualización completada. ${actualizados} contratos actualizados.`);
    
    // Desconectar de la base de datos
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
    
  } catch (error) {
    console.error('Error al actualizar estados de contratos:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ejecutar el script
updateContractStates(); 