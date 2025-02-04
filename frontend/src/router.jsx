import { createBrowserRouter } from 'react-router-dom';
import AuthCallback from './components/auth/AuthCallback';
import AuthError from './components/auth/AuthError';

export const router = createBrowserRouter([
  {
    path: '/auth/callback',
    element: <AuthCallback />
  },
  {
    path: '/auth/error',
    element: <AuthError />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
}); 