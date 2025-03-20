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

// Configuración de reintentos
const MAX_RETRIES = 3; 
const RETRY_DELAY = 60000; // 1 minuto

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

// Función para procesar el webhook en segundo plano
function processWebhook(req, requestId, retryCount = 0) {
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
    
    // Para pruebas manuales consideramos verificación automática
    if (req.path === '/test-deploy' || !req.headers['x-hub-signature'] && !req.headers['x-hub-signature-256']) {
        isVerified = true;
    }
    
    if (!isVerified) {
        logger.error(`[${requestId}] Firma inválida o error en verificación`, {
            signatureSha256: signatureSha256 ? signatureSha256.substring(0, 10) + '...' : 'no proporcionada',
            signatureSha1: req.headers['x-hub-signature'] ? req.headers['x-hub-signature'].substring(0, 10) + '...' : 'no proporcionada',
            body_sample: payload.substring(0, 100) + '...',
            secret_used: webhookSecret.substring(0, 3) + '...',
            headers: JSON.stringify(req.headers).substring(0, 200) + '...'
        });
        return;
    }

    // Determinar si deberíamos procesar este push basado en la rama y el ambiente
    let shouldProcess = false;
    let environment = SERVER_ENVIRONMENT;
    
    // Solo procesamos las ramas que coinciden con nuestro ambiente
    if (environment === 'staging' && req.body.ref === 'refs/heads/staging') {
        shouldProcess = true;
    } else if (environment === 'production' && (
                req.body.ref === 'refs/heads/main' || 
                req.body.ref === 'refs/heads/master' || 
                req.body.ref === 'refs/heads/production')) {
        shouldProcess = true;
    }

    if (!shouldProcess) {
        logger.info(`[${requestId}] Ignorando push a ${req.body.ref} en servidor ${environment}`);
        return;
    }

    logger.info(`[${requestId}] Recibido push a ${req.body.ref}, iniciando actualización para ${environment} (${hostname}) - Intento ${retryCount + 1}/${MAX_RETRIES + 1}`);
    
    // Variables para el proceso de actualización
    const backupName = `${environment}_backup_${Date.now()}`;
    let oldGitHash = null;
    
    // Realizar backup de la base de datos
    performBackup(environment, backupName, requestId)
        .then(() => {
            // Obtener el hash del commit actual antes de actualizar
            return getCurrentGitHash(requestId);
        })
        .then((gitHash) => {
            oldGitHash = gitHash;
            logger.info(`[${requestId}] Commit actual antes de actualizar: ${oldGitHash}`);
            
            // Ejecutar git pull
            return gitPull(req.body.ref, requestId);
        })
        .then((gitPullResult) => {
            // Verificar si hubo cambios en el código
            return getNewGitHash(requestId)
                .then(newGitHash => {
                    if (oldGitHash === newGitHash) {
                        logger.info(`[${requestId}] No hay cambios en el código. Mismo commit: ${newGitHash}`);
                        return Promise.resolve({ noChanges: true });
                    }
                    
                    logger.info(`[${requestId}] Nuevos cambios detectados. Commit anterior: ${oldGitHash}, Nuevo commit: ${newGitHash}`);
                    return Promise.resolve({ noChanges: false });
                });
        })
        .then((result) => {
            if (result.noChanges) {
                logger.info(`[${requestId}] No hay cambios que aplicar. Finalizando proceso.`);
                return Promise.resolve();
            }
            
            // Reconstruir contenedores
            return rebuildContainers(environment, requestId)
                .then(() => {
                    // Verificar que todo funcione correctamente
                    return checkServices(environment, requestId);
                })
                .catch(error => {
                    logger.error(`[${requestId}] Error durante el despliegue: ${error.message}`);
                    
                    // Intentar hacer rollback
                    return performRollback(environment, oldGitHash, backupName, requestId)
                        .then(() => {
                            throw new Error(`Despliegue fallido. Se ha realizado rollback a ${oldGitHash}`);
                        });
                });
        })
        .then(() => {
            logger.info(`[${requestId}] Proceso de actualización completado con éxito`);
        })
        .catch(error => {
            logger.error(`[${requestId}] Error en el proceso de actualización: ${error.message}`);
            
            // Implementar sistema de reintentos
            if (retryCount < MAX_RETRIES) {
                const nextRetry = retryCount + 1;
                logger.info(`[${requestId}] Reintentando proceso en ${RETRY_DELAY/1000} segundos (intento ${nextRetry}/${MAX_RETRIES})`);
                
                setTimeout(() => {
                    processWebhook(req, requestId, nextRetry);
                }, RETRY_DELAY);
            } else {
                logger.error(`[${requestId}] Se han agotado todos los reintentos (${MAX_RETRIES}). Se requiere intervención manual.`);
                // Aquí podrías enviar una notificación al equipo (email, slack, etc.)
            }
        });
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
    
    processWebhook(req, requestId);
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