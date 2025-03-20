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
const webhookSecret = process.env.WEBHOOK_PRODUCTION_SECRET || process.env.WEBHOOK_SECRET || 'ProductionSecret_ATTADIA99';

// Middleware para parsear JSON
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
    logger.info('Health check solicitado');
    res.status(200).send('healthy');
});

// Función para verificar la firma de GitHub
function verifySignature(payload, signature) {
    if (!signature) {
        logger.error('No se proporcionó firma');
        return false;
    }
    
    try {
        const hmac = crypto.createHmac('sha256', webhookSecret);
        const digest = 'sha256=' + hmac.update(payload).digest('hex');
        
        logger.info(`Verificando firma: ${signature} con secreto: ${webhookSecret.substring(0, 3)}...`);
        
        // Comparación segura: vulnerable a timing attacks pero más segura que una comparación directa
        return crypto.timingSafeEqual(
            Buffer.from(digest, 'utf8'),
            Buffer.from(signature, 'utf8')
        );
    } catch (error) {
        logger.error('Error al verificar firma', { 
            error: error.message,
            stack: error.stack,
            secret_length: webhookSecret ? webhookSecret.length : 0,
            signature_length: signature ? signature.length : 0
        });
        return false;
    }
}

// Endpoint del webhook - manejar tanto '/webhook' como '/'
app.post(['/', '/webhook'], (req, res) => {
    logger.info('Recibida solicitud webhook en la ruta: ' + req.path, {
        headers: req.headers,
        body_keys: Object.keys(req.body),
        method: req.method
    });
    
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    if (!verifySignature(payload, signature)) {
        logger.error('Firma inválida o error en verificación', {
            signature: signature,
            body_sample: payload.substring(0, 100) + '...',
            secret_used: webhookSecret.substring(0, 3) + '...'
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
        logger.info(`Push recibido en una rama diferente (${req.body.ref}), ignorando`);
        return res.status(200).send('Ignored non-deployment branch push');
    }

    logger.info(`Recibido push a ${req.body.ref}, iniciando actualización para ${environment}`);
    
    // Ejecutar script de actualización
    exec(`cd /home/poloatt/present && git pull origin ${req.body.ref}`, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Error al ejecutar git pull para ${environment}`, { 
                error: error.message,
                stdout,
                stderr
            });
            return res.status(500).send('Error updating repository');
        }
        
        // Reconstruir y reiniciar los contenedores según el ambiente
        const composeFile = environment === 'production' ? 'docker-compose.prod.yml' : 'docker-compose.staging.yml';
        exec(`cd /home/poloatt/present && docker-compose -f ${composeFile} up -d --build`, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error al reconstruir contenedores para ${environment}`, {
                    error: error.message,
                    stdout,
                    stderr
                });
                return res.status(500).send('Error rebuilding containers');
            }
            
            logger.info(`Actualización completada exitosamente para ${environment}`, { stdout });
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