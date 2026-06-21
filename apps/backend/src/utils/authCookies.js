import config from '../config/config.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_PATH = '/api/auth';

export function getRefreshCookieOptions() {
  const options = {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_MAX_AGE_MS,
    path: COOKIE_PATH,
  };

  if (config.authCookieDomain) {
    options.domain = config.authCookieDomain;
  }

  return options;
}

export function setRefreshTokenCookie(res, refreshToken) {
  if (!refreshToken) return;
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

export function clearRefreshTokenCookie(res) {
  const clearOptions = { path: COOKIE_PATH };
  if (config.authCookieDomain) {
    res.clearCookie(REFRESH_COOKIE_NAME, { ...clearOptions, domain: config.authCookieDomain });
  }
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
  // Vestigial cookie sin domain
  res.clearCookie('token', clearOptions);
}

export function getRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;
}
