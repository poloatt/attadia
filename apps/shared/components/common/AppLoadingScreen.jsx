import React from 'react';
import GoogleLoader from './GoogleLoader.jsx';

/** Matches MUI theme `background.default` — used before ThemeProvider mounts. */
export const APP_LOADING_BG = '#181818';

/**
 * Full-screen loading shell for auth bootstrap, app switches, and route guards.
 * Self-contained (no MUI theme) so it works in App.jsx before ThemeProvider.
 */
export default function AppLoadingScreen({ message }) {
  return (
    <div
      className="app-loading-screen"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={message || 'Cargando'}
    >
      <GoogleLoader />
      {message ? (
        <p className="app-loading-screen__message">{message}</p>
      ) : null}
    </div>
  );
}
