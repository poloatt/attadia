import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar configuración de producción
dotenv.config({ path: path.resolve(__dirname, '.env.prod') });

console.log('=== PRUEBA MERCADOPAGO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MERCADOPAGO_ACCESS_TOKEN:', process.env.MERCADOPAGO_ACCESS_TOKEN ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('MERCADOPAGO_CLIENT_ID:', process.env.MERCADOPAGO_CLIENT_ID);
console.log('MERCADOPAGO_PUBLIC_KEY:', process.env.MERCADOPAGO_PUBLIC_KEY);

try {
  // Importar MercadoPago usando la sintaxis correcta
  const mercadopago = await import('mercadopago');
  console.log('✅ MercadoPago importado exitosamente');
  console.log('MercadoPago object:', Object.keys(mercadopago));
  
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('No se encontró MERCADOPAGO_ACCESS_TOKEN');
  }
  
  console.log('✅ Access token encontrado:', accessToken.substring(0, 20) + '...');
  
  // Usar la sintaxis correcta para configurar
  mercadopago.configure({
    access_token: accessToken
  });
  
  console.log('✅ MercadoPago configurado exitosamente');
  
  const result = await mercadopago.preferences.create({
    items: [
      {
        title: 'Pago de prueba - Validación app MercadoPago',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: 10.00
      }
    ]
  });
  
  console.log('✅ Preferencia creada exitosamente');
  console.log('Preference ID:', result.body.id);
  console.log('Init Point:', result.body.init_point);
  console.log('Sandbox Init Point:', result.body.sandbox_init_point);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
} 