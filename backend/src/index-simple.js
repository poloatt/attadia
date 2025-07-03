import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

// CORS básico
app.use(cors({
  origin: 'https://admin.attadia.com',
  credentials: true
}));

app.use(express.json());

// Health check ultra simple
app.get('/health', (req, res) => {
  console.log('Health check - ultra simple');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend ultra simple funcionando'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test exitoso',
    env: process.env.NODE_ENV,
    port: port
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(port, () => {
  console.log(`Servidor ultra simple iniciado en puerto ${port}`);
}); 