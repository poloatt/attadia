#!/usr/bin/env node

/**
 * Script para probar específicamente el flujo OAuth de MercadoPago
 * y diagnosticar problemas de scopes
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar configuración
const environment = process.env.NODE_ENV || 'production';
const envPath = path.resolve(__dirname, environment === 'production' ? '../.env.prod' : '../.env.' + environment);
dotenv.config({ path: envPath });

const CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID;
const CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET;
const REDIRECT_URI = 'https://admin.attadia.com/mercadopago/callback';

async function testOAuthFlow() {
  console.log('=== PRUEBA DE FLUJO OAUTH MERCADOPAGO ===');
  console.log('Ambiente:', environment);
  console.log('Client ID configurado:', !!CLIENT_ID);
  console.log('Client Secret configurado:', !!CLIENT_SECRET);
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Error: MERCADOPAGO_CLIENT_ID o MERCADOPAGO_CLIENT_SECRET no están configurados');
    return;
  }

  try {
    // 1. Generar URL de autorización
    console.log('1. Generando URL de autorización...');
    const scopes = ['read', 'offline_access', 'write'].join(' ');
    const state = 'test-state-' + Date.now();
    
    const authUrl = `https://auth.mercadopago.com/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scopes)}&prompt=consent`;
    
    console.log('✅ URL de autorización generada:');
    console.log('   Scopes solicitados:', scopes);
    console.log('   State:', state);
    console.log('   URL completa:', authUrl);
    console.log('');

    // 2. Verificar configuración de la app
    console.log('2. Verificando configuración de la app...');
    console.log('   Para que el OAuth funcione correctamente, verifica en MercadoPago Developers:');
    console.log('   - La app debe tener configurado el redirect_uri:', REDIRECT_URI);
    console.log('   - La app debe tener permisos para los scopes: read, offline_access, write');
    console.log('   - La app debe estar en modo PRODUCCIÓN (no sandbox)');
    console.log('');

    // 3. Instrucciones para el usuario
    console.log('3. Instrucciones para probar:');
    console.log('   1. Abre esta URL en tu navegador:');
    console.log(`      ${authUrl}`);
    console.log('   2. Autoriza la aplicación en MercadoPago');
    console.log('   3. Copia el código de autorización de la URL de redirección');
    console.log('   4. Ejecuta: node test-mercadopago-oauth.js <codigo>');
    console.log('');

    // Si se proporciona un código, probarlo
    const code = process.argv[2];
    if (code) {
      console.log('4. Probando intercambio de código por token...');
      console.log('   Código recibido:', code);
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      });

      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Intercambio de token exitoso:');
        console.log('   Access Token:', data.access_token ? data.access_token.substring(0, 20) + '...' : 'NO RECIBIDO');
        console.log('   Refresh Token:', data.refresh_token ? 'RECIBIDO' : 'NO RECIBIDO');
        console.log('   User ID:', data.user_id);
        console.log('   Token Type:', data.token_type);
        console.log('   Expires In:', data.expires_in);
        console.log('   Scope recibido:', data.scope);
        console.log('');

        // 5. Probar el token obtenido
        console.log('5. Probando token obtenido...');
        const userRes = await fetch('https://api.mercadopago.com/users/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'PresentApp/1.0'
          }
        });

        if (userRes.ok) {
          const userInfo = await userRes.json();
          console.log('✅ Token funciona correctamente:');
          console.log('   User ID:', userInfo.id);
          console.log('   Nickname:', userInfo.nickname);
          console.log('   Email:', userInfo.email);
        } else {
          const errorText = await userRes.text();
          console.log('❌ Error con el token:', userRes.status);
          console.log('   Error:', errorText);
          console.log('');
          console.log('💡 Posibles soluciones:');
          console.log('   1. Verifica que la app en MercadoPago Developers tenga permisos para "read"');
          console.log('   2. Verifica que el redirect_uri coincida exactamente');
          console.log('   3. Verifica que la app esté en modo PRODUCCIÓN');
        }
      } else {
        console.log('❌ Error en intercambio de token:', response.status);
        console.log('   Error:', data.error);
        console.log('   Description:', data.error_description);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testOAuthFlow(); 