import fetch from 'node-fetch';
import config from '../config/config.js';

export function getAuthUrl(redirectUri) {
  const clientId = config.mercadopago.clientId;
  if (!clientId) {
    throw new Error('MERCADOPAGO_CLIENT_ID no está configurado');
  }
  return `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export async function exchangeCodeForToken({ code, redirectUri }) {
  const clientId = config.mercadopago.clientId;
  const clientSecret = config.mercadopago.clientSecret;
  
  if (!clientId || !clientSecret) {
    throw new Error('Configuración de MercadoPago incompleta. Verifica MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET');
  }
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  });

  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const data = await response.json();
  if (!data.access_token) throw new Error(data.error_description || 'No se pudo obtener access token');
  return data;
}

/**
 * Refresca el access_token de MercadoPago usando el refresh_token
 * @param {Object} params
 * @param {string} params.refreshToken - El refresh_token recibido previamente
 * @returns {Promise<Object>} - Nuevo access_token y refresh_token
 *
 * Documentación oficial:
 * https://www.mercadopago.com.ar/developers/es/reference/oauth/_oauth_token/post
 */
export async function refreshAccessToken({ refreshToken }) {
  const clientId = config.mercadopago.clientId;
  const clientSecret = config.mercadopago.clientSecret;
  
  if (!clientId || !clientSecret) {
    throw new Error('Configuración de MercadoPago incompleta. Verifica MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET');
  }
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const data = await response.json();
  if (!data.access_token) throw new Error(data.error_description || 'No se pudo refrescar access token');
  return data;
} 