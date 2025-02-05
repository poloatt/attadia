  import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Container,
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
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login({ email, password });
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setError('Error al iniciar sesión con Google. Por favor, intenta más tarde.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: 4 }}>
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: '#1a1a1a',
          border: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
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
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: 'rgba(255, 255, 255, 0.9)',
              }
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
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: 'rgba(255, 255, 255, 0.9)',
              }
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Typography 
              color="error" 
              variant="body2" 
              sx={{ mt: 2 }}
            >
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
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
            Iniciar Sesión
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
    </Container>
  );
}

export default Login; 