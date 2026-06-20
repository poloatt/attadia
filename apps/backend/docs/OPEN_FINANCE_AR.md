# Open Finance Argentina (SFA) — Preparación Attadia

**Estado:** Junio 2026 — en desarrollo regulatorio  
**Autoridad:** BCRA (Decreto 353/2025)

## Contexto

Argentina creó el **Sistema de Finanzas Abiertas (SFA)** para que usuarios compartan datos financieros con consentimiento explícito. Mercado Pago (>3M usuarios) será participante obligatorio.

Hoy **no hay API pública de wallet en tiempo real** para integradores terceros en MLA. La integración actual de Attadia usa:

1. OAuth MP + `payments/search` (parcial, checkout)
2. Account Money Report API (CSV async)
3. Import CSV manual

## Monitoreo SFA (implementado)

Attadia expone el estado de monitoreo vía API (sin integración SFA activa aún):

```
GET /api/bankconnections/mercadopago/sfa-status
```

Implementación: `apps/backend/src/services/sfaMonitorService.js`

| Campo | Valor actual |
|-------|--------------|
| `phase` | `PRE_LAUNCH` |
| `apiVersion` | `null` (BCRA no publicó 1.0) |
| `integrationEnabled` | `false` (activar con `OPEN_FINANCE_SFA_ENABLED=true` cuando exista spec) |
| `expectedRelease` | 2026 |

### Checklist de monitoreo

- [ ] Seguir publicaciones BCRA sobre SFA API 1.0
- [ ] Evaluar registro como TPP/receptor cuando se abra
- [ ] Diseñar UI de consentimiento y revocación
- [ ] Implementar `OpenFinanceSfaAdapter` cuando haya OpenAPI oficial
- [ ] Migrar sync MP de reportes CSV a APIs SFA

### Cuándo implementar

Activar integración solo cuando se cumplan **todas**:

1. BCRA publica especificación API SFA 1.0 (OpenAPI/Swagger)
2. Proceso de registro Attadia como participante disponible
3. Mercado Pago expone endpoints SFA en sandbox

Hasta entonces: mantener Fase 1 MP (settlement + CSV). Ver `SETTLEMENT_API_VALIDATION.md`.

## Objetivo futuro

Cuando el BCRA publique el estándar API SFA 1.0, Attadia deberá:

- Registrarse como participante/receptor de datos (requisitos TBD)
- Implementar flujo de consentimiento del usuario
- Consumir APIs estandarizadas de cuentas, saldos y transacciones

## Modelo de datos preparado

`BankConnection` ya soporta:

```javascript
{
  tipo: 'MERCADOPAGO', // futuro: 'OPEN_FINANCE_SFA'
  credenciales: { accessToken, refreshToken, userId },
  configuracion: { categorizacionAutomatica, frecuenciaSincronizacion }
}
```

Extensión propuesta para SFA:

```javascript
{
  tipo: 'OPEN_FINANCE_SFA',
  credenciales: {
    consentId: String,
    institutionId: 'mercadopago',
    accessToken: String,
    refreshToken: String,
    expiresAt: Date
  },
  metadata: {
    scopes: ['accounts', 'balances', 'transactions'],
    consentStatus: 'active' | 'revoked' | 'expired'
  }
}
```

## Flujo de consentimiento (referencia Brasil)

```mermaid
sequenceDiagram
  participant User
  participant Attadia
  participant SFA as SFA_BCRA
  participant MP as MercadoPago

  User->>Attadia: Conectar wallet MP
  Attadia->>SFA: Iniciar consentimiento
  SFA->>User: Pantalla autorización
  User->>SFA: Acepta compartir datos
  SFA->>Attadia: access_token + consent_id
  Attadia->>MP: GET /accounts, /balances, /transactions
  MP->>Attadia: Datos wallet
```

## APIs esperadas (basado en Open Finance Brasil)

| Recurso | Endpoint referencia BR | Uso Attadia |
|---------|------------------------|-------------|
| Cuentas | GET /accounts/v2/accounts | Listar cuentas MP del usuario |
| Saldos | GET /accounts/v2/accounts/{id}/balances | Actualizar `Cuentas.saldo` |
| Transacciones | GET /accounts/v2/accounts/{id}/transactions | Crear `Transacciones` |

## Referencias

- [Decreto 353/2025 — Finanzas Abiertas](https://www.argentina.gob.ar/normativa/nacional/decreto-353-2025-123456789)
- [Open Finance Brasil — API Contas](https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/17371899/)
- [Mercado Pago — Account Money Report API](https://www.mercadopago.com.ar/developers/es/docs/reports/account-money/api)
- Validación settlement: `apps/backend/docs/SETTLEMENT_API_VALIDATION.md`
