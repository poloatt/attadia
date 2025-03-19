import express from 'express';
import { exec } from 'child_process';
import crypto from 'crypto';

const router = express.Router();

// Función para verificar la firma de GitHub
const verifyGitHubSignature = (req, secret) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    console.error('No se encontró la firma en los headers');
    return false;
  }

  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = 'sha256=' + hmac.update(payload).digest('hex');
  
  console.log('Verificando firma del webhook:', {
    receivedSignature: signature,
    calculatedSignature: calculatedSignature
  });
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
};

// Ruta del webhook
router.post('/', async (req, res) => {
  console.log('Webhook recibido:', {
    headers: req.headers,
    body: req.body
  });

  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('GITHUB_WEBHOOK_SECRET no está configurado');
    return res.status(500).json({ error: 'Configuración del webhook incompleta' });
  }

  // Verificar que es una petición válida de GitHub
  if (!verifyGitHubSignature(req, webhookSecret)) {
    console.error('Firma del webhook inválida');
    return res.status(401).json({ error: 'Firma inválida' });
  }

  const { ref } = req.body;
  console.log('Webhook recibido para ref:', ref);

  // Solo procesar eventos de la rama main/production
  if (ref !== 'refs/heads/main' && ref !== 'refs/heads/production') {
    console.log('Ignorando webhook para rama diferente de main/production');
    return res.status(200).json({ message: 'Ignorando rama diferente de main/production' });
  }

  try {
    // Ejecutar el script de auto-deploy
    exec('/home/poloatt/present/scripts/auto-deploy.sh production', 
      (error, stdout, stderr) => {
        if (error) {
          console.error('Error al ejecutar el script de auto-deploy:', error);
          console.error('stderr:', stderr);
          return res.status(500).json({ error: 'Error al actualizar la aplicación' });
        }

        console.log('Auto-deploy ejecutado exitosamente:', stdout);
        res.status(200).json({ message: 'Auto-deploy iniciado con éxito' });
      }
    );
  } catch (error) {
    console.error('Error en el webhook:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta OPTIONS para manejar preflight requests
router.options('/', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');
  res.status(204).end();
});

export default router; 