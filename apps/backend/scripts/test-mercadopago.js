import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar configuración de producción
dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });

console.log('=== PRUEBA MERCADOPAGO PRODUCCIÓN ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MERCADOPAGO_ACCESS_TOKEN:', process.env.MERCADOPAGO_ACCESS_TOKEN ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('MERCADOPAGO_CLIENT_ID:', process.env.MERCADOPAGO_CLIENT_ID);
console.log('MERCADOPAGO_PUBLIC_KEY:', process.env.MERCADOPAGO_PUBLIC_KEY);

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ ERROR: No se encontró MERCADOPAGO_ACCESS_TOKEN en .env.prod');
  process.exit(1);
}

// Prueba: API REST directa (igual que en producción)
console.log('\n=== PRUEBA: API REST DIRECTA (PRODUCCIÓN) ===');
try {
  const preferenceData = {
    items: [
      {
        title: 'Pago de prueba - Producción',
        quantity: 1,
        unit_price: 10.00
      }
    ],
    back_urls: {
      success: `${process.env.FRONTEND_URL || 'https://present.attadia.com'}/auth/callback`,
      failure: `${process.env.FRONTEND_URL || 'https://present.attadia.com'}/auth/error`,
      pending: `${process.env.FRONTEND_URL || 'https://present.attadia.com'}/auth/callback`
    },
    auto_return: 'approved',
    external_reference: 'test_production_' + Date.now()
  };

  console.log('📤 Enviando a API REST:', JSON.stringify(preferenceData, null, 2));

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preferenceData)
  });

  const responseData = await response.json();
  
  if (response.ok) {
    console.log('✅ API REST exitosa');
    console.log('Preference ID:', responseData.id);
    console.log('Init Point:', responseData.init_point);
    console.log('External Reference:', responseData.external_reference);
    console.log('\n🔗 URL para probar:', responseData.init_point);
  } else {
    console.log('❌ API REST falló:', response.status);
    console.log('Error:', responseData);
  }
} catch (error) {
  console.error('❌ Error API REST:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n=== FIN DE PRUEBA ==='); 