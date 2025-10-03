const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const { exec } = require('child_process');
const crypto = require('crypto');
const os = require('os');
require('dotenv').config();

// Detectar automáticamente el ambiente basado en el hostname
const hostname = os.hostname();
const isStaging = hostname.includes('staging') || hostname.includes('foco-staging');
const SERVER_ENVIRONMENT = isStaging ? 'staging' : 'production';

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
    try {
        // Verificar que el servidor esté funcionando correctamente
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: SERVER_ENVIRONMENT,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
        
        logger.info('Health check exitoso', healthStatus);
        res.status(200).json(healthStatus);
    } catch (error) {
        logger.error('Error en health check', { error: error.message });
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
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
        logger.error(`[${requestId}] Firma inválida o error en verificación`);
        return;
    }

    // Determinar el flujo de deployment basado en el ambiente y la rama
    let shouldProcess = false;
    let environment = SERVER_ENVIRONMENT;
    let isPromotionToProduction = false;
    
    // Lógica de procesamiento según el ambiente
    if (environment === 'staging') {
        // En staging aceptamos pushes a staging y main/master para validación
        if (req.body.ref === 'refs/heads/staging' || 
            req.body.ref === 'refs/heads/main' || 
            req.body.ref === 'refs/heads/master') {
            shouldProcess = true;
            logger.info(`[${requestId}] Validando cambios en staging antes de producción`);
        }
    } else if (environment === 'production') {
        // En producción solo aceptamos pushes a main/master que hayan pasado por staging
        if (req.body.ref === 'refs/heads/main' || req.body.ref === 'refs/heads/master') {
            // Aquí podríamos agregar una verificación adicional para asegurar que el commit pasó por staging
            shouldProcess = true;
            isPromotionToProduction = true;
            logger.info(`[${requestId}] Procesando deployment a producción`);
        }
    }

    if (!shouldProcess) {
        logger.info(`[${requestId}] Ignorando push a ${req.body.ref} en servidor ${environment}`);
        return;
    }

    logger.info(`[${requestId}] Iniciando ${isPromotionToProduction ? 'deployment a producción' : 'validación en staging'} para ${req.body.ref}`);
    
    // Variables para el proceso de actualización
    const backupName = `${environment}_backup_${Date.now()}`;
    let oldGitHash = null;
    
    // Realizar backup de la base de datos
    performBackup(environment, backupName, requestId)
        .then(() => {
            return getCurrentGitHash(requestId);
        })
        .then((gitHash) => {
            oldGitHash = gitHash;
            logger.info(`[${requestId}] Commit actual antes de actualizar: ${oldGitHash}`);
            
            return gitPull(req.body.ref, requestId);
        })
        .then((gitPullResult) => {
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
                    // Verificación extendida en staging
                    if (environment === 'staging') {
                        logger.info(`[${requestId}] Iniciando verificación extendida en staging`);
                        return runStagingValidations(requestId);
                    }
                    return checkServices(environment, requestId);
                })
                .catch(error => {
                    logger.error(`[${requestId}] Error durante el ${isPromotionToProduction ? 'deployment' : 'validación'}: ${error.message}`);
                    return performRollback(environment, oldGitHash, backupName, requestId)
                        .then(() => {
                            throw new Error(`Proceso fallido. Se ha realizado rollback a ${oldGitHash}`);
                        });
                });
        })
        .then(() => {
            if (environment === 'staging') {
                logger.info(`[${requestId}] Validación en staging completada con éxito. El código está listo para producción.`);
                // Aquí podrías agregar notificación o marcador para indicar que está listo para prod
            } else {
                logger.info(`[${requestId}] Deployment a producción completado con éxito`);
            }
        })
        .catch(error => {
            logger.error(`[${requestId}] Error en el proceso: ${error.message}`);
            if (retryCount < MAX_RETRIES) {
                const nextRetry = retryCount + 1;
                logger.info(`[${requestId}] Reintentando en ${RETRY_DELAY/1000} segundos (intento ${nextRetry}/${MAX_RETRIES})`);
                setTimeout(() => {
                    processWebhook(req, requestId, nextRetry);
                }, RETRY_DELAY);
            } else {
                logger.error(`[${requestId}] Se han agotado los reintentos. Se requiere intervención manual.`);
            }
        });
}

// Función para ejecutar validaciones adicionales en staging
async function runStagingValidations(requestId) {
    logger.info(`[${requestId}] Ejecutando validaciones de staging`);
    
    // Aquí agregaríamos validaciones específicas para staging
    // Por ejemplo:
    // 1. Verificar que todos los servicios están respondiendo
    // 2. Ejecutar pruebas de integración
    // 3. Verificar métricas básicas
    // 4. Validar configuraciones
    
    return new Promise((resolve, reject) => {
        // Implementar las validaciones necesarias
        checkServices('staging', requestId)
            .then(() => {
                logger.info(`[${requestId}] Validaciones de staging completadas con éxito`);
                resolve();
            })
            .catch(error => {
                logger.error(`[${requestId}] Error en validaciones de staging: ${error.message}`);
                reject(error);
            });
    });
}

// Endpoint del webhook - manejar tanto '/webhook' como '/'
app.post(['/', '/webhook'], (req, res) => {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    
    // Log detallado de la solicitud
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
    
    // Responder inmediatamente con éxito para evitar timeouts en GitHub
    res.status(200).send(`Webhook received and processing - ID: ${requestId}`);
    
    // Procesar el webhook en segundo plano
    setTimeout(() => {
        processWebhook(req, requestId);
    }, 100);
});

// Ruta para prueba manual del webhook
app.get('/test-deploy', (req, res) => {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    logger.info(`[${requestId}] Solicitud de prueba manual recibida`);
    
    // Verificar autorización
    if (req.query.token !== 'secreto123') {
        logger.warn(`[${requestId}] Intento de prueba manual sin token válido`);
        return res.status(401).send('Unauthorized - Invalid token');
    }
    
    // Usar el ambiente del servidor actual o el especificado en la consulta
    const environment = req.query.env || SERVER_ENVIRONMENT;
    const ref = environment === 'production' ? 'refs/heads/main' : 'refs/heads/staging';
    
    const mockReq = {
        path: '/test-deploy',
        headers: {},
        body: {
            ref: ref
        },
        ip: req.ip
    };
    
    // Iniciar actualización
    logger.info(`[${requestId}] Iniciando prueba manual para ${environment} en servidor ${hostname}`);
    res.status(200).send(`Prueba manual iniciada - ID: ${requestId} - Ambiente: ${environment} - Servidor: ${hostname}`);
    
    // Procesar en segundo plano
    setTimeout(() => {
        processWebhook(mockReq, requestId);
    }, 100);
});

// Ruta de depuración
app.get('/debug', (req, res) => {
    logger.info('Solicitud de debug recibida');
    res.status(200).json({
        message: 'Webhook server funcionando correctamente',
        environment: process.env.NODE_ENV,
        serverEnvironment: SERVER_ENVIRONMENT,
        port: port,
        timestamp: new Date().toISOString(),
        hostname: hostname
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