import { Monedas } from '../models/index.js';

export const initializeMonedas = async () => {
  try {
    const monedasPredeterminadas = [
      {
        codigo: 'USD',
        nombre: 'Dólar Estadounidense',
        simbolo: '$',
        tasaCambio: 1,
        activa: true
      },
      {
        codigo: 'EUR',
        nombre: 'Euro',
        simbolo: '€',
        tasaCambio: 0.85,
        activa: true
      }
    ];

    for (const moneda of monedasPredeterminadas) {
      const existeMoneda = await Monedas.findOne({ codigo: moneda.codigo });
      if (!existeMoneda) {
        await Monedas.create(moneda);
        console.log(`Moneda ${moneda.codigo} creada exitosamente`);
      }
    }

    console.log('Inicialización de monedas completada');
  } catch (error) {
    console.error('Error al inicializar monedas:', error);
  }
}; 