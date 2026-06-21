/** Producción o subdominios locales: SSO vía cookie httpOnly compartida. */
export function isCrossAppSsoViaCookie() {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return (
    hostname.endsWith('.attadia.com')
    || hostname === 'attadia.com'
    || hostname.endsWith('.local.attadia.com')
  );
}

/** localhost con puertos distintos: cookies no cruzan orígenes. */
export function isLocalhostDev() {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
