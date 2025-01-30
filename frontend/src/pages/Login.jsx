import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  IconButton,
  InputAdornment,
  Alert,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Google as GoogleIcon } from '@mui/icons-material';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      console.error('Error en login:', error);
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <Container maxWidth="xs">
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
          bgcolor: '#1a1a1a'
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4,
            width: '100%',
            bgcolor: '#242424',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography 
            variant="h5" 
            component="h1" 
            align="center"
            sx={{ 
              mb: 4,
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '0.5px'
            }}
          >
            Iniciar Sesión
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(255, 82, 82, 0.1)',
                color: '#ff5252',
                border: '1px solid rgba(255, 82, 82, 0.2)'
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              mb: 3,
              py: 1.5,
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              },
              letterSpacing: '0.5px',
              fontSize: '0.9rem',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                opacity: 0,
                transition: 'opacity 0.3s',
              },
              '&:hover::after': {
                opacity: 1,
              }
            }}
          >
            Continuar con Google
          </Button>

          <Divider 
            sx={{ 
              mb: 3,
              '&::before, &::after': {
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                px: 2
              }}
            >
              o con email
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              margin="normal"
              size="medium"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              margin="normal"
              size="medium"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)',
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                py: 1.5,
                bgcolor: '#ffffff',
                color: '#1a1a1a',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)'
                },
                letterSpacing: '0.5px',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              ¿No tienes una cuenta?
              <Button 
                onClick={() => navigate('/registro')}
                size="small"
                sx={{ 
                  ml: 1,
                  color: '#ffffff',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                Regístrate
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login; 