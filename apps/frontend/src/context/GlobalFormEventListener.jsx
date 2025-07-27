import { useEffect } from 'react';
import { useFormManager } from './FormContext';

export function GlobalFormEventListener() {
  const { openForm } = useFormManager();

  useEffect(() => {
    const handler = (event) => {
      if (event.detail?.type) {
        openForm(event.detail.type, event.detail.initialData || null);
      }
    };
    window.addEventListener('headerAddButtonClicked', handler);
    return () => window.removeEventListener('headerAddButtonClicked', handler);
  }, [openForm]);

  return null;
} 