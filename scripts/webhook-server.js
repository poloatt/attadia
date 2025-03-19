import http from 'http';
import { exec } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';

const PORT = process.env.PORT || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'tu_secreto_aqui';
const LOG_FILE = process.env.LOG_FILE || '/var/log/webhook-server/webhook-server.log';

// Función para logging
const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    
    // Escribir en archivo de log
    fs.appendFileSync(LOG_FILE, logMessage);
};

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            // Verificar la firma del webhook
            const signature = req.headers['x-hub-signature-256'];
            if (!signature) {
                log('Error: No se encontró la firma del webhook');
                res.writeHead(401);
                return res.end('Firma no encontrada');
            }
            
            const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
            const digest = 'sha256=' + hmac.update(body).digest('hex');
            
            if (signature !== digest) {
                log('Error: Firma inválida');
                res.writeHead(401);
                return res.end('Firma inválida');
            }
            
            try {
                const event = JSON.parse(body);
                const githubEvent = req.headers['x-github-event'];
                
                if (githubEvent !== 'push') {
                    log(`Evento ignorado: ${githubEvent}`);
                    res.writeHead(200);
                    return res.end('Evento ignorado');
                }
                
                // Determinar la rama y el entorno
                let environment = null;
                
                if (event.ref === 'refs/heads/staging') {
                    environment = 'staging';
                } else if (event.ref === 'refs/heads/main' || 
                           event.ref === 'refs/heads/master' || 
                           event.ref === 'refs/heads/production') {
                    environment = 'production';
                }
                
                if (!environment) {
                    log(`Rama ignorada: ${event.ref}`);
                    res.writeHead(200);
                    return res.end('Rama ignorada');
                }
                
                log(`Recibido push a rama ${event.ref}, ejecutando deploy para entorno ${environment}...`);
                
                // Ejecutar script de deploy con el entorno correspondiente
                const deployScript = '/home/poloatt/present/scripts/auto-deploy.sh';
                
                exec(`bash ${deployScript} ${environment}`, 
                    (error, stdout, stderr) => {
                        if (error) {
                            log(`Error en deploy de ${environment}:`);
                            log(error.toString());
                            log(`stderr: ${stderr}`);
                        }
                        log(`Deploy de ${environment} completado:`);
                        log(stdout);
                    }
                );
                
                res.writeHead(200);
                res.end(`Deploy iniciado para entorno ${environment}`);
            } catch (error) {
                log(`Error al procesar webhook: ${error.toString()}`);
                res.writeHead(400);
                res.end('Error al procesar webhook');
            }
        });
    } else {
        res.writeHead(404);
        res.end('No encontrado');
    }
});

// Escuchar en todas las interfaces (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
    log(`Servidor webhook escuchando en puerto ${PORT} en todas las interfaces (IPv4 e IPv6)`);
}); 