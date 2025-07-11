import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../utils/logger.js';

export function getAuthUrl(redirectUri) {
  const clientId = config.mercadopago.clientId;
  if (!clientId) {
    logger.error('MERCADOPAGO_CLIENT_ID no está configurado', null, { redirectUri });
    throw new Error('MERCADOPAGO_CLIENT_ID no está configurado');
  }
  
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  logger.mercadopago('AUTH_URL_GENERATED', 'URL de autorización generada', {
    clientId: clientId ? 'configurado' : 'no configurado',
    redirectUri,
    authUrl: authUrl.substring(0, 100) + '...' // Log parcial por seguridad
  });
  
  return authUrl;
}

export async function exchangeCodeForToken({ code, redirectUri }) {
  const startTime = Date.now();
  
  const clientId = config.mercadopago.clientId;
  const clientSecret = config.mercadopago.clientSecret;
  
  if (!clientId || !clientSecret) {
    logger.error('Configuración de MercadoPago incompleta', null, {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri
    });
    throw new Error('Configuración de MercadoPago incompleta. Verifica MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET');
  }
  
  logger.mercadopago('TOKEN_EXCHANGE_START', 'Iniciando intercambio de código por token', {
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
    const duration = Date.now() - startTime;
    
    logger.mercadopago('TOKEN_EXCHANGE_RESPONSE', 'Respuesta de intercambio de token recibida', {
      status: response.status,
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasUserId: !!data.user_id,
      error: data.error,
      errorDescription: data.error_description,
      duration
    });
    
    if (!response.ok) {
      logger.error('Error en intercambio de token', null, {
        status: response.status,
        error: data.error,
        errorDescription: data.error_description,
        duration
      });
      throw new Error(`Error ${response.status}: ${data.error_description || data.error || 'Error desconocido'}`);
    }
    
    if (!data.access_token) {
      logger.error('No se pudo obtener access token', null, {
        errorDescription: data.error_description,
        duration
      });
      throw new Error(data.error_description || 'No se pudo obtener access token');
    }
    
    logger.mercadopago('TOKEN_EXCHANGE_SUCCESS', 'Intercambio de token exitoso', {
      userId: data.user_id,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
      duration
    });
    
    logger.performance('mercadopago_token_exchange', duration, {
      userId: data.user_id,
      success: true
    });
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error en exchangeCodeForToken', error, {
      duration,
      redirectUri
    });
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
  const startTime = Date.now();
  
  const clientId = config.mercadopago.clientId;
  const clientSecret = config.mercadopago.clientSecret;
  
  if (!clientId || !clientSecret) {
    logger.error('Configuración de MercadoPago incompleta para refresh', null, {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });
    throw new Error('Configuración de MercadoPago incompleta. Verifica MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET');
  }
  
  logger.mercadopago('TOKEN_REFRESH_START', 'Iniciando refresh de token', {
    hasRefreshToken: !!refreshToken
  });
  
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
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      logger.error('Error en refresh de token', null, {
        status: response.status,
        error: data.error,
        errorDescription: data.error_description,
        duration
      });
      throw new Error(`Error ${response.status}: ${data.error_description || data.error || 'Error desconocido'}`);
    }
    
    if (!data.access_token) {
      logger.error('No se pudo refrescar access token', null, {
        errorDescription: data.error_description,
        duration
      });
      throw new Error(data.error_description || 'No se pudo refrescar access token');
    }
    
    logger.mercadopago('TOKEN_REFRESH_SUCCESS', 'Refresh de token exitoso', {
      userId: data.user_id,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      duration
    });
    
    logger.performance('mercadopago_token_refresh', duration, {
      userId: data.user_id,
      success: true
    });
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error en refreshAccessToken', error, { duration });
    throw error;
  }
} 