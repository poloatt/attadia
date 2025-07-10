# Configuración de MercadoPago OAuth

## Variables de Entorno Requeridas

Para que la integración con MercadoPago funcione correctamente, necesitas configurar las siguientes variables de entorno:

### Desarrollo (.env.development)
```bash
MERCADOPAGO_CLIENT_ID=tu_client_id_de_mercadopago
MERCADOPAGO_CLIENT_SECRET=tu_client_secret_de_mercadopago
```

### Staging (.env.staging)
```bash
MERCADOPAGO_CLIENT_ID=tu_client_id_de_mercadopago
MERCADOPAGO_CLIENT_SECRET=tu_client_secret_de_mercadopago
```

### Producción (.env.production)
```bash
MERCADOPAGO_CLIENT_ID=tu_client_id_de_mercadopago
MERCADOPAGO_CLIENT_SECRET=tu_client_secret_de_mercadopago
```

## Configuración en MercadoPago

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Crea una nueva aplicación
3. Configura las URLs de redirección:
   - **Desarrollo**: `http://localhost:5173/mercadopago/callback`
   - **Staging**: `https://staging.present.attadia.com/mercadopago/callback`
   - **Producción**: `https://present.attadia.com/mercadopago/callback`

## Flujo de OAuth

1. El usuario hace clic en "Conectar MercadoPago"
2. El frontend solicita la URL de autorización al backend
3. El backend genera la URL usando las credenciales configuradas
4. El usuario es redirigido a MercadoPago para autorizar
5. MercadoPago redirige de vuelta con un código de autorización
6. El frontend envía el código al backend
7. El backend intercambia el código por tokens de acceso
8. Se crea/actualiza la conexión bancaria en la base de datos
9. Se sincronizan las transacciones automáticamente

## Troubleshooting

### Error: "MERCADOPAGO_CLIENT_ID no está configurado"
- Verifica que las variables de entorno estén definidas en el archivo .env correspondiente
- Reinicia el servidor después de agregar las variables

### Error: "Error de autorización"
- Verifica que las URLs de redirección en MercadoPago coincidan con tu entorno
- Asegúrate de que el dominio esté configurado correctamente

### Error: "Error conectando con MercadoPago"
- Verifica los logs del backend para más detalles
- Asegúrate de que las credenciales sean correctas
- Verifica que la aplicación en MercadoPago esté activa

## Logs Útiles

El sistema genera logs detallados para ayudar con el debugging:

```bash
# Backend logs
Procesando callback MercadoPago: { code: '...', redirectUri: '...' }
Conexión MercadoPago creada y sincronizada

# Frontend logs
Solicitando URL de autorización MercadoPago con redirect_uri: ...
URL de autorización recibida: ...
Procesando código de autorización MercadoPago: ...
``` 