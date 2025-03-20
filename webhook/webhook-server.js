const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const { exec } = require('child_process');
const crypto = require('crypto');
require('dotenv').config();

// Configuración del logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: process.env.LOG_FILE || '/var/log/webhook-server/webhook-production.log'
        })
    ]
});

// Si no estamos en producción, también log a la consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const app = express();
const port = process.env.PORT || 9000;
const webhookSecret = process.env.WEBHOOK_SECRET || 'ProductionSecret_ATTADIA99';

// Registrar la configuración al inicio para depuración
logger.info('Configuración del webhook:', {
    port,
    environment: process.env.NODE_ENV,
    webhookSecretLength: webhookSecret ? webhookSecret.length : 0,
    webhookSecretStart: webhookSecret ? webhookSecret.substring(0, 3) : null,
    nodePath: process.execPath,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid
});

// Registrar todas las variables de entorno disponibles (sin valores sensibles)
const sanitizedEnv = Object.keys(process.env).reduce((acc, key) => {
    // Evitar registrar valores sensibles
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        acc[key] = '[REDACTED]';
    } else {
        acc[key] = typeof process.env[key] === 'string' && process.env[key].length > 50 
            ? process.env[key].substring(0, 50) + '...' 
            : process.env[key];
    }
    return acc;
}, {});
logger.info('Variables de entorno disponibles:', sanitizedEnv);

// Middleware para parsear JSON
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
    logger.info('Health check solicitado');
    res.status(200).send('healthy');
});

// Función para verificar la firma de GitHub
function verifySignature(payload, signature, signatureType = 'sha256') {
    if (!signature) {
        logger.error('No se proporcionó firma');
        return false;
    }
    
    try {
        let digest;
        if (signatureType === 'sha1') {
            const hmac = crypto.createHmac('sha1', webhookSecret);
            digest = 'sha1-' + hmac.update(payload).digest('hex');
        } else {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            digest = 'sha256=' + hmac.update(payload).digest('hex');
        }
        
        logger.info(`Verificando firma ${signatureType}: ${signature} con secreto: ${webhookSecret.substring(0, 3)}...`);
        
        try {
            // Comparación segura usando timingSafeEqual
            return crypto.timingSafeEqual(
                Buffer.from(digest, 'utf8'),
                Buffer.from(signature, 'utf8')
            );
        } catch (compareError) {
            // Si la comparación falla (posiblemente por longitudes diferentes), registra el error
            logger.error('Error en la comparación de firmas', {
                error: compareError.message,
                digestLength: digest.length,
                signatureLength: signature.length,
                digest: digest.substring(0, 10) + '...',
                signature: signature.substring(0, 10) + '...'
            });
            return false;
        }
    } catch (error) {
        logger.error('Error al verificar firma', { 
            error: error.message,
            stack: error.stack,
            signatureType,
            secret_length: webhookSecret ? webhookSecret.length : 0,
            signature_length: signature ? signature.length : 0
        });
        return false;
    }
}

// Endpoint del webhook - manejar tanto '/webhook' como '/'
app.post(['/', '/webhook'], (req, res) => {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    
    logger.info(`[${requestId}] Recibida solicitud webhook en la ruta: ${req.path}`, {
        headers: Object.keys(req.headers),
        body_keys: Object.keys(req.body),
        method: req.method,
        ip: req.ip,
        body_sample: JSON.stringify(req.body).substring(0, 100) + '...'
    });
    
    // Añadir un log de las cabeceras importantes
    const importantHeaders = [
        'x-hub-signature', 'x-hub-signature-256', 'x-github-event', 
        'x-github-delivery', 'content-type', 'user-agent'
    ];
    
    const headerValues = {};
    importantHeaders.forEach(header => {
        headerValues[header] = req.headers[header] || 'no proporcionado';
    });
    
    logger.info(`[${requestId}] Cabeceras importantes:`, headerValues);
    
    let isVerified = false;
    const payload = JSON.stringify(req.body);
    
    // Intentar verificar usando SHA-256
    const signatureSha256 = req.headers['x-hub-signature-256'];
    if (signatureSha256) {
        isVerified = verifySignature(payload, signatureSha256, 'sha256');
    }
    
    // Si SHA-256 falla, intentar con SHA-1
    if (!isVerified) {
        const signatureSha1 = req.headers['x-hub-signature'];
        if (signatureSha1) {
            isVerified = verifySignature(payload, signatureSha1, 'sha1');
        }
    }
    
    if (!isVerified) {
        logger.error('Firma inválida o error en verificación', {
            signatureSha256: signatureSha256 ? signatureSha256.substring(0, 10) + '...' : 'no proporcionada',
            signatureSha1: req.headers['x-hub-signature'] ? req.headers['x-hub-signature'].substring(0, 10) + '...' : 'no proporcionada',
            body_sample: payload.substring(0, 100) + '...',
            secret_used: webhookSecret.substring(0, 3) + '...',
            headers: JSON.stringify(req.headers).substring(0, 200) + '...'
        });
        return res.status(401).send('Invalid signature');
    }

    // Determinar el ambiente basado en la rama
    let environment = null;
    if (req.body.ref === 'refs/heads/staging') {
        environment = 'staging';
    } else if (req.body.ref === 'refs/heads/main' || 
               req.body.ref === 'refs/heads/master' || 
               req.body.ref === 'refs/heads/production') {
        environment = 'production';
    }

    if (!environment) {
        logger.info(`[${requestId}] Push recibido en una rama diferente (${req.body.ref}), ignorando`);
        return res.status(200).send('Ignored non-deployment branch push');
    }

    logger.info(`[${requestId}] Recibido push a ${req.body.ref}, iniciando actualización para ${environment}`);
    
    // Ejecutar script de actualización
    logger.info(`[${requestId}] Ejecutando: cd /home/poloatt/present && git pull origin ${req.body.ref}`);
    exec(`cd /home/poloatt/present && git pull origin ${req.body.ref}`, (error, stdout, stderr) => {
        if (error) {
            logger.error(`[${requestId}] Error al ejecutar git pull para ${environment}`, { 
                error: error.message,
                stdout,
                stderr,
                command: `git pull origin ${req.body.ref}`,
                cwd: '/home/poloatt/present'
            });
            return res.status(500).send('Error updating repository');
        }
        
        // Registrar la salida del comando git pull
        logger.info(`[${requestId}] Git pull completado exitosamente para ${environment}`, { stdout, stderr });
        
        // Reconstruir y reiniciar los contenedores según el ambiente
        const composeFile = environment === 'production' ? 'docker-compose.prod.yml' : 'docker-compose.staging.yml';
        const dockerCommand = `cd /home/poloatt/present && docker-compose -f ${composeFile} up -d --build`;
        
        logger.info(`[${requestId}] Ejecutando: ${dockerCommand}`);
        exec(dockerCommand, (error, stdout, stderr) => {
            if (error) {
                logger.error(`[${requestId}] Error al reconstruir contenedores para ${environment}`, {
                    error: error.message,
                    stdout,
                    stderr,
                    command: dockerCommand,
                    cwd: '/home/poloatt/present'
                });
                return res.status(500).send('Error rebuilding containers');
            }
            
            logger.info(`[${requestId}] Actualización completada exitosamente para ${environment}`, { 
                stdout,
                stderr,
                fecha: new Date().toISOString()
            });
            res.status(200).send(`Update completed successfully for ${environment}`);
        });
    });
});

// Ruta de depuración
app.get('/debug', (req, res) => {
    logger.info('Solicitud de debug recibida');
    res.status(200).json({
        message: 'Webhook server funcionando correctamente',
        environment: process.env.NODE_ENV,
        port: port,
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    logger.error('Error en el servidor', { error: err.message });
    res.status(500).send('Internal Server Error');
});

// Iniciar servidor
app.listen(port, () => {
    logger.info(`Servidor webhook iniciado en puerto ${port}`);
});