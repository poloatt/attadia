  import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Google as GoogleIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estilos comunes para los campos de texto
  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#232323',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '& input': {
        bgcolor: '#232323',
        color: 'rgba(255, 255, 255, 0.9)',
        ':-webkit-autofill': {
          WebkitBoxShadow: '0 0 0 100px #232323 inset',
          WebkitTextFillColor: 'rgba(255,255,255,0.9)',
        },
        ':-webkit-autofill:focus': {
          WebkitBoxShadow: '0 0 0 100px #232323 inset',
          WebkitTextFillColor: 'rgba(255,255,255,0.9)',
        },
        ':-webkit-autofill:hover': {
          WebkitBoxShadow: '0 0 0 100px #232323 inset',
          WebkitTextFillColor: 'rgba(255,255,255,0.9)',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir múltiples envíos
    if (loading) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('🚀 Iniciando login...');
      const result = await login({ email, password });
      console.log('✅ Login completado, redirigiendo a /');
      navigate('/');
    } catch (error) {
      // Solo mostrar error si no es una cancelación por duplicación
      if (!error.cancelado) {
        const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      toast.error('Error al iniciar sesión con Google. Por favor, intenta más tarde.');
    }
  };

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 }, mt: 4, maxWidth: 400, mx: 'auto' }}>
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: '#1a1a1a',
          border: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          width: '100%',
          borderRadius: 0
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ 
              mb: 2,
              ...textFieldStyles
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <Tooltip title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&:hover': { 
                        color: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    {showPassword ? <HideValuesIcon sx={{ fontSize: 18 }} /> : <ShowValuesIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
              ),
            }}
            sx={textFieldStyles}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />



          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2,
              textTransform: 'none',
              py: 1,
              bgcolor: '#000',
              color: '#fff',
              '&:hover': {
                bgcolor: '#333'
              }
            }}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon sx={{ fontSize: 18 }} />}
            onClick={handleGoogleLogin}
            sx={{ 
              textTransform: 'none',
              py: 1,
              color: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
                bgcolor: 'transparent'
              }
            }}
          >
            Continuar con Google
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login; 
