import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Box,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.name.trim()) {
      return setError('El nombre es requerido');
    }

    if (!formData.email.trim()) {
      return setError('El email es requerido');
    }

    if (!formData.password) {
      return setError('La contraseña es requerida');
    }

    if (formData.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2.5,
            width: '100%',
            bgcolor: '#1a1a1a',
            borderRadius: 1,
            border: '1px solid #333'
          }}
        >
          <Typography 
            variant="h6" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{ 
              mb: 2, 
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 500
            }}
          >
            Crear Cuenta
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 1,
                bgcolor: '#2c1c1c',
                color: '#ff8080',
                '& .MuiAlert-icon': {
                  color: '#ff8080'
                }
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              name="name"
              label="Nombre"
              fullWidth
              size="small"
              margin="dense"
              value={formData.name}
              onChange={handleChange}
              required
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#444',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#666',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888',
                  fontSize: '0.85rem',
                },
                '& .MuiInputBase-input': {
                  color: '#cccccc',
                  fontSize: '0.9rem',
                }
              }}
            />
            
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              size="small"
              margin="dense"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#444',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#666',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888',
                  fontSize: '0.85rem',
                },
                '& .MuiInputBase-input': {
                  color: '#cccccc',
                  fontSize: '0.9rem',
                }
              }}
            />
            
            <TextField
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              margin="dense"
              value={formData.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      size="small"
                      sx={{ color: '#666' }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#444',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#666',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888',
                  fontSize: '0.85rem',
                },
                '& .MuiInputBase-input': {
                  color: '#cccccc',
                  fontSize: '0.9rem',
                }
              }}
            />
            
            <TextField
              name="confirmPassword"
              label="Confirmar Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              margin="dense"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end"
                      size="small"
                      sx={{ color: '#666' }}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#444',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#666',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888',
                  fontSize: '0.85rem',
                },
                '& .MuiInputBase-input': {
                  color: '#cccccc',
                  fontSize: '0.9rem',
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="small"
              sx={{ 
                mb: 2,
                textTransform: 'none',
                bgcolor: '#1f1f1f',
                opacity: 0.9,
                color: '#fff',
                '&:hover': {
                  bgcolor: '#2a2a2a',
                  opacity: 1
                },
                '&:active': {
                  bgcolor: '#151515'
                }
              }}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/login"
                sx={{ 
                  color: '#999',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#fff',
                    textDecoration: 'underline'
                  }
                }}
              >
                ¿Ya tienes una cuenta? Inicia sesión
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 