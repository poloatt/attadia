// Exportaciones centralizadas de middlewares de autenticación y autorización

// Middleware de autenticación principal
export { checkAuth } from './auth.js';

// Middlewares de autorización
export { checkRole, ROLES } from './checkRole.js';
export { checkOwnership } from './checkOwnership.js';

// Utilidades de autorización
export * from './authUtils.js';

// Middleware de validación de campos (si existe)
// export { validateFields } from './validateFields.js';
