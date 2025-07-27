#!/usr/bin/env node

/**
 * Script de prueba para verificar el flujo completo de MercadoPago
 * 
 * Uso:
 * node test-mercadopago-flow.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar configuración
const environment = process.env.NODE_ENV || 'production';
const envPath = path.resolve(__dirname, '../.env.' + environment);
dotenv.config({ path: envPath });

const BASE_URL = process.env.BACKEND_URL || 'https://api.admin.attadia.com';
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

async function testMercadoPagoFlow() {
  console.log('=== PRUEBA DE FLUJO MERCADOPAGO ===');
  console.log('Ambiente:', environment);
  console.log('Base URL:', BASE_URL);
  console.log('Access Token configurado:', !!ACCESS_TOKEN);
  console.log('');

  try {
    // 1. Probar endpoint de diagnóstico
    console.log('1. Probando endpoint de diagnóstico...');
    const diagnosticoRes = await fetch(`${BASE_URL}/api/bankconnections/pagos/diagnostico`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    if (diagnosticoRes.ok) {
      const diagnosticoData = await diagnosticoRes.json();
      console.log('✅ Diagnóstico exitoso:', diagnosticoData.success);
      if (diagnosticoData.envVars) {
        console.log('   Variables de entorno:', diagnosticoData.envVars);
      }
    } else {
      console.log('❌ Error en diagnóstico:', diagnosticoRes.status);
    }
    console.log('');

    // 2. Probar creación de preferencia de pago
    console.log('2. Probando creación de preferencia de pago...');
    const preferenciaRes = await fetch(`${BASE_URL}/api/bankconnections/pagos/prueba`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    if (preferenciaRes.ok) {
      const preferenciaData = await preferenciaRes.json();
      console.log('✅ Preferencia creada:', preferenciaData.success);
      if (preferenciaData.preference_id) {
        console.log('   Preference ID:', preferenciaData.preference_id);
        console.log('   Init Point:', preferenciaData.init_point);
      }
    } else {
      const errorData = await preferenciaRes.json();
      console.log('❌ Error creando preferencia:', errorData.message);
      console.log('   Detalles:', errorData.details);
    }
    console.log('');

    // 3. Probar URL de autorización
    console.log('3. Probando generación de URL de autorización...');
    const authUrlRes = await fetch(`${BASE_URL}/api/bankconnections/mercadopago/auth-url?redirect_uri=https://admin.attadia.com/mercadopago/callback`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    if (authUrlRes.ok) {
      const authUrlData = await authUrlRes.json();
      console.log('✅ URL de autorización generada');
      console.log('   Auth URL:', authUrlData.authUrl.substring(0, 100) + '...');
      console.log('   State:', authUrlData.state);
    } else {
      const errorData = await authUrlRes.json();
      console.log('❌ Error generando URL de autorización:', errorData.message);
    }
    console.log('');

    // 4. Si tenemos un access token, probar permisos
    if (ACCESS_TOKEN) {
      console.log('4. Probando permisos del access token...');
      const permisosRes = await fetch(`${BASE_URL}/api/bankconnections/mercadopago/probar-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ accessToken: ACCESS_TOKEN })
      });

      if (permisosRes.ok) {
        const permisosData = await permisosRes.json();
        console.log('✅ Prueba de permisos completada');
        console.log('   Resumen:', permisosData.resumen);
        if (permisosData.resultados) {
          Object.entries(permisosData.resultados).forEach(([endpoint, resultado]) => {
            console.log(`   ${endpoint}: ${resultado.success ? '✅ OK' : '❌ ERROR'}`);
            if (!resultado.success && resultado.error) {
              console.log(`     Error: ${resultado.error}`);
            }
          });
        }
      } else {
        const errorData = await permisosRes.json();
        console.log('❌ Error probando permisos:', errorData.message);
      }
    } else {
      console.log('4. ⚠️  No hay access token configurado para probar permisos');
    }
    console.log('');

    console.log('=== PRUEBA COMPLETADA ===');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar la prueba
testMercadoPagoFlow(); 