import dotenv from 'dotenv';

// Determinar qué archivo de configuración cargar según el entorno
const env = process.env.NODE_ENV || 'development';
let configModule;

switch (env) {
  case 'production':
    dotenv.config({ path: '.env.production' });
    configModule = await import('./config.prod.js');
    break;
  case 'staging':
    dotenv.config({ path: '.env.staging' });
    configModule = await import('./config.staging.js');
    break;
  case 'development':
  default:
    dotenv.config({ path: '.env.development' });
    configModule = await import('./config.dev.js');
    break;
}

const config = configModule.default;

console.log(`Cargando configuración para el entorno: ${env}`);
console.log('Configuración de MongoDB:', {
  url: config.mongoUrl,
  environment: config.env
});

export default config;