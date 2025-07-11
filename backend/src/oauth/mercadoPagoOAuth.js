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
  
  console.log('Intercambiando código por token:', {
    clientId: clientId ? 'configurado' : 'no configurado',
    clientSecret: clientSecret ? 'configurado' : 'no configurado',
    code: code ? 'presente' : 'ausente',
    redirectUri
  });
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  });

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const data = await response.json();
    
    console.log('Respuesta de MercadoPago OAuth:', {
      status: response.status,
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasUserId: !!data.user_id,
      error: data.error,
      errorDescription: data.error_description
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${data.error_description || data.error || 'Error desconocido'}`);
    }
    
    if (!data.access_token) {
      throw new Error(data.error_description || 'No se pudo obtener access token');
    }
    
    return data;
  } catch (error) {
    console.error('Error en exchangeCodeForToken:', error);
    throw error;
  }
}

/**
 * Refresca el access_token de MercadoPago usando el refresh_token
 * @param {Object} params
 * @param {string} params.refreshToken - El refresh_token recibido previamente
 * @returns {Promise<Object>} - Nuevo access_token y refresh_token
 *
 * Documentación oficial:
 * https://www.mercadopago.com.ar/developers/en/reference/oauth/_oauth_token/post
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

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${data.error_description || data.error || 'Error desconocido'}`);
    }
    
    if (!data.access_token) {
      throw new Error(data.error_description || 'No se pudo refrescar access token');
    }
    
    return data;
  } catch (error) {
    console.error('Error en refreshAccessToken:', error);
    throw error;
  }
} 