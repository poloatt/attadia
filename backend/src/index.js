import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import contratoRoutes from './routes/contratoRoutes.js';
import cuentaRoutes from './routes/cuentaRoutes.js';
import habitacionRoutes from './routes/habitacionRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import inquilinoRoutes from './routes/inquilinoRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import labRoutes from './routes/labRoutes.js';
import monedaRoutes from './routes/monedaRoutes.js';
import perfilRoutes from './routes/perfilRoutes.js';
import propiedadRoutes from './routes/propiedadRoutes.js';
import proyectosRoutes from './routes/proyectosRoutes.js';
import rutinasRoutes from './routes/rutinasRoutes.js';
import tareasRoutes from './routes/tareasRoutes.js';
import subtareasRoutes from './routes/subtareasRoutes.js';
import transaccionesRoutes from './routes/transaccionesRoutes.js';

const app = express();

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/cuentas', cuentaRoutes);
app.use('/api/habitaciones', habitacionRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/inquilinos', inquilinoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/monedas', monedaRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/propiedades', propiedadRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/subtareas', subtareasRoutes);
app.use('/api/transacciones', transaccionesRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 