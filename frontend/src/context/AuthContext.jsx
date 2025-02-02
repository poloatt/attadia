import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';

const AuthContext = createContext();

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null
  });

  const checkAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await axios.get('/api/auth/check');
      setState({ user: response.data, loading: false, error: null });
    } catch (error) {
      setState({ 
        user: null, 
        loading: false, 
        error: error.response?.status === 401 ? null : error 
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await axios.post('/api/auth/login', credentials);
      setState({ user: response.data.user, loading: false, error: null });
      return response.data;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setState({ ...state, loading: false, error: error.response?.data || { error: 'Error al iniciar sesión' } });
      throw error.response?.data || { error: 'Error al iniciar sesión' };
    }
  };

  const loginWithGoogle = () => {
    setState(prev => ({ ...prev, loading: true }));
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await axios.post('/api/auth/logout');
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setState({ ...state, loading: false, error: error });
      throw error;
    }
  };

  const value = {
    user: state.user,
    login,
    loginWithGoogle,
    logout,
    checkAuth,
    loading: state.loading,
    error: state.error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider, useAuth };
