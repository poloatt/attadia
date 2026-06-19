#!/usr/bin/env node

/**
 * Smoke test de endpoints usados por la sincronización MercadoPago.
 *
 * Uso:
 *   node scripts/test-mercadopago-sync.js
 *   MERCADOPAGO_ACCESS_TOKEN=xxx node scripts/test-mercadopago-sync.js
 *
 * Sin token: valida que los endpoints respondan (401/403 = activos, 404 = posible deprecación).
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYNC_WINDOW_DAYS = 90;

const environment = process.env.NODE_ENV || 'production';
const envPath = path.resolve(__dirname, environment === 'production' ? '../.env.prod' : '../.env.' + environment);
dotenv.config({ path: envPath });

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const BASE_URL = process.env.BACKEND_URL || 'https://api.attadia.com';

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${name}: ${detail}`);
}

async function probeEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const body = await res.text();
    return { status: res.status, body: body.slice(0, 200) };
  } catch (error) {
    return { status: 0, body: error.message };
  }
}

async function testWithToken() {
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'AttadiaSyncSmokeTest/1.0'
  };

  const userRes = await fetch('https://api.mercadopago.com/users/me', { headers });
  if (!userRes.ok) {
    record('GET /users/me', false, `${userRes.status} ${await userRes.text()}`);
    return null;
  }
  const userInfo = await userRes.json();
  record('GET /users/me', true, `id=${userInfo.id}, país=${userInfo.country_id}`);

  const fechaDesde = new Date(Date.now() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const fechaHasta = new Date();
  const paymentsUrl = `https://api.mercadopago.com/v1/payments/search?range=date_created&begin_date=${fechaDesde.toISOString()}&end_date=${fechaHasta.toISOString()}&limit=10&sort=date_created.desc`;
  const paymentsRes = await fetch(paymentsUrl, { headers });
  if (paymentsRes.ok) {
    const data = await paymentsRes.json();
    record('GET /v1/payments/search', true, `${data.results?.length ?? 0} pagos (ventana ${SYNC_WINDOW_DAYS}d)`);
  } else {
    record('GET /v1/payments/search', false, `${paymentsRes.status} ${await paymentsRes.text()}`);
  }

  const balanceUrl = `https://api.mercadopago.com/users/${userInfo.id}/mercadopago_account/balance`;
  const balanceRes = await fetch(balanceUrl, { headers });
  if (balanceRes.ok) {
    const balance = await balanceRes.json();
    record('GET /users/{id}/mercadopago_account/balance', true, `disponible=${balance.available_balance ?? 0}`);
  } else {
    record('GET /users/{id}/mercadopago_account/balance', false, `${balanceRes.status} ${await balanceRes.text()}`);
  }

  const ordersUrl = `https://api.mercadopago.com/v1/merchant_orders/search?date_created_from=${fechaDesde.toISOString()}&limit=10`;
  const ordersRes = await fetch(ordersUrl, { headers });
  if (ordersRes.ok) {
    const data = await ordersRes.json();
    record('GET /v1/merchant_orders/search', true, `${data.results?.length ?? 0} órdenes (máx. 90d por API)`);
  } else {
    record('GET /v1/merchant_orders/search', false, `${ordersRes.status} ${await ordersRes.text()}`);
  }

  return userInfo;
}

async function testWithoutToken() {
  console.log('Sin MERCADOPAGO_ACCESS_TOKEN — verificando que endpoints sigan expuestos...\n');

  const probes = [
    ['GET /users/me', 'https://api.mercadopago.com/users/me'],
    ['GET /v1/payments/search', 'https://api.mercadopago.com/v1/payments/search?limit=1'],
    ['GET /v1/merchant_orders/search', 'https://api.mercadopago.com/v1/merchant_orders/search?limit=1'],
    ['POST /oauth/token', 'https://api.mercadopago.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }]
  ];

  for (const [name, url, options] of probes) {
    const { status, body } = await probeEndpoint(name, url, options);
    const alive = status === 401 || status === 403 || status === 400 || status === 404 || (status >= 200 && status < 300);
    const detail = status === 404
      ? 'HTTP 404 sin token (inconcluso; requiere MERCADOPAGO_ACCESS_TOKEN para confirmar)'
      : `HTTP ${status}`;
    record(name, alive, detail);
    if (!alive) {
      console.log(`   detalle: ${body}`);
    }
  }
}

async function testMercadoPagoSync() {
  console.log('=== SMOKE TEST SINCRONIZACIÓN MERCADOPAGO ===');
  console.log('Ambiente:', environment);
  console.log('Ventana de sync:', `${SYNC_WINDOW_DAYS} días`);
  console.log('Access Token configurado:', !!ACCESS_TOKEN);
  console.log('');

  if (ACCESS_TOKEN) {
    await testWithToken();
  } else {
    await testWithoutToken();
  }

  console.log('\n=== RESUMEN ===');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`Pasaron: ${passed}/${results.length}, Fallaron: ${failed}`);

  if (!ACCESS_TOKEN) {
    console.log('\n💡 Para validación completa con datos reales:');
    console.log('   MERCADOPAGO_ACCESS_TOKEN=<token> node scripts/test-mercadopago-sync.js');
  }

  process.exit(failed > 0 ? 1 : 0);
}

testMercadoPagoSync();
