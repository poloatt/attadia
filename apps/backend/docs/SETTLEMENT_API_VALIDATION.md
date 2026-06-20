# Validación Account Money Report API (settlement_report)

Guía para verificar que la API de reportes funciona con una cuenta **wallet personal MLA** usando token OAuth de usuario.

## Requisitos

- Token OAuth de usuario con scopes `read offline_access` (sin `write`)
- Cuenta Mercado Pago Argentina (country_id = AR)

## Ejecución

```bash
# Diagnóstico rápido (~30s): users/me, payments, config, create, list
MERCADOPAGO_ACCESS_TOKEN=APP_USR-... node apps/backend/scripts/test-mercadopago-sync.js

# Validación completa (~2 min): incluye poll y descarga CSV
MERCADOPAGO_ACCESS_TOKEN=APP_USR-... node apps/backend/scripts/test-mercadopago-sync.js --full
```

Obtener token OAuth: `node apps/backend/scripts/test-mercadopago-oauth.js` o reconectar cuenta en Attadia.

## Criterios de éxito

| Paso | Endpoint | Resultado esperado |
|------|----------|-------------------|
| 1 | `GET /users/me` | 200, `country_id: AR` |
| 2 | `POST /v1/account/settlement_report/config` | 200/201 o 409 (ya existe) |
| 3 | `POST /v1/account/settlement_report` | **202 Accepted** (async) |
| 4 | `GET /v1/account/settlement_report/list` | 200, array con reportes |
| 5 | Poll + `GET /v1/account/settlement_report/{file}` | CSV descargable con movimientos |

## Configuración de poll (Attadia sync)

Variables de entorno opcionales:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MP_SETTLEMENT_POLL_INTERVAL_MS` | 3000 | Intervalo entre intentos de poll |
| `MP_SETTLEMENT_MAX_POLL_ATTEMPTS` | 40 | Intentos (~2 min total) |
| `MP_SETTLEMENT_PENDING_MAX_AGE_MS` | 86400000 | Re-solicitar reporte si pendiente > 24h |

Si el poll agota el timeout, Attadia guarda un **reporte pendiente** en la conexión y lo completa en la próxima sincronización (cron o manual).

## Fallback

Si la API falla de forma persistente para cuentas personales:

1. Descargar CSV "Dinero en cuenta" desde el panel MP
2. Importar en Attadia: Cuentas → Datos MP → Importar CSV

**No usar parsing de emails** — misma data, frágil y fuera de ToS.

## Referencias

- [Account Money Report API](https://www.mercadopago.com.ar/developers/es/docs/reports/account-money/api)
- Implementación: `apps/backend/src/services/mercadoPagoReportService.js`
