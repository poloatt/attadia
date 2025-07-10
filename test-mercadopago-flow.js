const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const REDIRECT_URI = 'http://localhost:5173/mercadopago/callback';

// Simular un token de autenticación (en producción esto vendría del login)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2EyNDg3Mjc0OTYzYTJjY2MxY2Y0NjYiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzM5NzI5NjAwLCJleHAiOjE3Mzk4MTYwMDB9.example';

async function testMercadoPagoFlow() {
  console.log('🧪 Probando flujo completo de MercadoPago OAuth\n');

  try {
    // Paso 1: Obtener URL de autorización
    console.log('1️⃣ Obteniendo URL de autorización...');
    const authResponse = await axios.get(`${BASE_URL}/api/bankconnections/mercadopago/auth-url`, {
      params: { redirect_uri: REDIRECT_URI },
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });

    console.log('✅ URL de autorización obtenida:');
    console.log(authResponse.data.authUrl);
    console.log('');

    // Paso 2: Simular el callback con un código de autorización
    console.log('2️⃣ Simulando callback con código de autorización...');
    console.log('⚠️  Nota: Este es un código simulado para pruebas');
    
    const mockCode = 'mock_authorization_code_12345';
    
    const callbackResponse = await axios.post(`${BASE_URL}/api/bankconnections/mercadopago/callback`, {
      code: mockCode
    }, {
      headers: { 
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Respuesta del callback:');
    console.log(callbackResponse.data);
    console.log('');

    // Paso 3: Verificar conexiones creadas
    console.log('3️⃣ Verificando conexiones bancarias...');
    const connectionsResponse = await axios.get(`${BASE_URL}/api/bankconnections`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });

    const mercadopagoConnections = connectionsResponse.data.filter(conn => conn.tipo === 'MERCADOPAGO');
    console.log(`✅ Conexiones MercadoPago encontradas: ${mercadopagoConnections.length}`);
    
    if (mercadopagoConnections.length > 0) {
      console.log('📋 Detalles de la conexión:');
      console.log(`   - ID: ${mercadopagoConnections[0]._id}`);
      console.log(`   - Nombre: ${mercadopagoConnections[0].nombre}`);
      console.log(`   - Estado: ${mercadopagoConnections[0].estado}`);
      console.log(`   - Tipo: ${mercadopagoConnections[0].tipo}`);
    }

  } catch (error) {
    console.error('❌ Error en el flujo:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Error de autenticación - Verifica el token');
    } else if (error.response?.status === 500) {
      console.log('🔧 Error del servidor - Revisa los logs del backend');
    }
  }
}

// Ejecutar la prueba
testMercadoPagoFlow(); 