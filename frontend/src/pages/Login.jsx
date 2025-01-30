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
  InputAdornment,
  IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function Login() {
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
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
            Iniciar Sesión
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
              label="Email"
              type="email"
              fullWidth
              size="small"
              margin="dense"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              margin="dense"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
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
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/register" 
                variant="body2"
                sx={{ 
                  color: '#999',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#fff',
                    textDecoration: 'underline'
                  }
                }}
              >
                ¿No tienes una cuenta? Regístrate
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 