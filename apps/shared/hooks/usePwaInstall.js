import { useState, useEffect, useCallback } from 'react';
import { PWA_DISMISS_KEY } from '../config/pwaConfig';

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true ||
    (document.referrer && document.referrer.includes('android-app://'))
  );
}

export function isPwaInstallDismissed() {
  try {
    return localStorage.getItem(PWA_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissPwaInstall() {
  try {
    localStorage.setItem(PWA_DISMISS_KEY, '1');
  } catch {
    // ignorar
  }
}

/**
 * Hook para capturar beforeinstallprompt y gestionar instalación PWA.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandalonePwa);
  const [isDismissed, setIsDismissed] = useState(isPwaInstallDismissed);
  const [installError, setInstallError] = useState(null);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallError(null);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const canInstall = Boolean(deferredPrompt) && !isInstalled && !isDismissed;

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    setInstallError(null);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch (err) {
      setInstallError(err?.message || 'No se pudo iniciar la instalación');
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    dismissPwaInstall();
    setIsDismissed(true);
  }, []);

  return {
    canInstall,
    isInstalled,
    isDismissed,
    installError,
    promptInstall,
    dismiss,
  };
}

export default usePwaInstall;
