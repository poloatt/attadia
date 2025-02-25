import http from 'http';
import { exec } from 'child_process';
import crypto from 'crypto';

const PORT = process.env.PORT || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'tu_secreto_aqui';

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            // Verificar la firma del webhook
            const signature = req.headers['x-hub-signature-256'];
            const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
            const digest = 'sha256=' + hmac.update(body).digest('hex');
            
            if (signature !== digest) {
                console.error('Firma inválida');
                res.writeHead(401);
                return res.end('Firma inválida');
            }
            
            try {
                const event = JSON.parse(body);
                
                // Solo procesar push events a la rama produccion
                if (req.headers['x-github-event'] === 'push' && 
                    event.ref === 'refs/heads/produccion') {
                    
                    console.log('Recibido push a produccion, ejecutando deploy...');
                    
                    // Ejecutar script de deploy
                    exec('bash /home/polo/presentprod/scripts/auto-deploy.sh', 
                        (error, stdout, stderr) => {
                            if (error) {
                                console.error('Error en deploy:', error);
                                console.error('stderr:', stderr);
                            }
                            console.log('stdout:', stdout);
                        }
                    );
                    
                    res.writeHead(200);
                    res.end('Deploy iniciado');
                } else {
                    res.writeHead(200);
                    res.end('Evento ignorado');
                }
            } catch (error) {
                console.error('Error al procesar webhook:', error);
                res.writeHead(400);
                res.end('Error al procesar webhook');
            }
        });
    } else {
        res.writeHead(404);
        res.end('No encontrado');
    }
});

server.listen(PORT, () => {
    console.log(`Servidor webhook escuchando en puerto ${PORT}`);
}); 