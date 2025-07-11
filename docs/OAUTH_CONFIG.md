# Configuración de Google OAuth

Este documento describe la configuración necesaria para la autenticación con Google OAuth en los entornos de desarrollo y producción.

## Configuración en Google Cloud Console

### Para Desarrollo (foco-dev)

1. **Orígenes autorizados de JavaScript:**
   - `http://localhost:5173`
   - `http://localhost:5000`

2. **URIs de redirección autorizados:**
   - `http://localhost:5000/api/auth/google/callback`

3. **Credenciales:**
   ```env
   GOOGLE_CLIENT_ID=21564026422-0ncvsjsea468s3o4qrmlaljos0d2cumk.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   ```

### Para Producción (foco-prod)

1. **Orígenes autorizados de JavaScript:**
   - `https://present.attadia.com`
   - `https://admin.attadia.com`

2. **URIs de redirección autorizados:**
   - `https://api.admin.attadia.com/api/auth/google/callback`

3. **Credenciales:**
   ```env
   GOOGLE_CLIENT_ID=21564026422-n684af8adp48dni8tuc2q2pqc8npb1r7.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   ```

## Configuración de Archivos .env

### Desarrollo

1. En `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=21564026422-0ncvsjsea468s3o4qrmlaljos0d2cumk.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

2. En `frontend/.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=21564026422-0ncvsjsea468s3o4qrmlaljos0d2cumk.apps.googleusercontent.com
   ```

### Producción

1. En `backend/.env.production`:
   ```env
   GOOGLE_CLIENT_ID=21564026422-n684af8adp48dni8tuc2q2pqc8npb1r7.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_CALLBACK_URL=https://api.admin.attadia.com/api/auth/google/callback
   ```

2. En `frontend/.env.production`:
   ```env
   VITE_GOOGLE_CLIENT_ID=21564026422-n684af8adp48dni8tuc2q2pqc8npb1r7.apps.googleusercontent.com
   ```

## Notas Importantes

1. **Seguridad:**
   - Nunca comitear archivos `.env` al repositorio
   - Mantener las credenciales seguras
   - Usar diferentes credenciales para desarrollo y producción

2. **Configuración:**
   - Asegurarse de que los dominios y URIs coincidan exactamente
   - Verificar que los callbacks incluyan `/api/` en la ruta
   - Configurar CORS_ORIGINS correctamente en cada entorno

3. **Troubleshooting:**
   - Si hay errores de "invalid_client", verificar que las URIs coincidan exactamente
   - Para desarrollo local, asegurarse de usar `http://localhost` y no `http://127.0.0.1` 