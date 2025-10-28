# 🔄 Actualización de Modelos para MercadoPago Sync

## Fecha de Actualización
**28 de Octubre, 2025**

---

## 📋 Resumen General

Los modelos de datos de Attadia han sido actualizados para soportar completamente la sincronización con MercadoPago, incluyendo:
- ✅ Nuevos tipos de origen para transacciones
- ✅ Campos de comisiones y monto neto
- ✅ Metadata enriquecida de MercadoPago
- ✅ Campos específicos de cuenta MercadoPago

---

## 🔧 Cambios por Archivo

### 1. **Transacciones.js** - Modelo Principal

#### ✨ Nuevos Tipos de Origen
```javascript
origen: {
  tipo: {
    enum: [
      'MANUAL',
      'MERCADOPAGO',              // MercadoPago genérico
      'MERCADOPAGO_PAGO',         // Pagos específicos
      'MERCADOPAGO_MOVIMIENTO',   // Movimientos de cuenta
      'PLAID',
      'OPEN_BANKING',
      'API_DIRECTA'
    ]
  }
}
```

#### 💰 Nuevos Campos de Comisiones
```javascript
comisiones: {
  mercadopago: Number,    // Comisión de MercadoPago
  financieras: Number,    // Comisión por financiamiento
  envio: Number,          // Comisión de envío
  total: Number           // Total de comisiones
}
```

#### 📊 Campo de Monto Neto
```javascript
montoNeto: Number  // Monto después de comisiones
```

**Propósito:** Permite calcular el dinero real recibido después de que MercadoPago descuenta sus comisiones.

---

### 2. **Cuentas.js** - Información de Cuenta MercadoPago

#### 🏦 Nuevo Objeto MercadoPago
```javascript
mercadopago: {
  userId: String,                    // ID del usuario en MercadoPago
  email: String,                     // Email de la cuenta
  nickname: String,                  // Nickname del usuario
  countryId: String,                 // País (AR, BR, etc.)
  siteId: String,                    // Site ID (MLA, MLB, etc.)
  accountType: String,               // Tipo de cuenta
  verificado: Boolean,               // Cuenta verificada
  disponibleRetiro: Number,          // Dinero disponible
  disponiblePendiente: Number        // Dinero pendiente
}
```

**Propósito:** Almacenar información completa de la cuenta MercadoPago para referencia y análisis.

---

### 3. **mercadoPagoDataService.js** - Lógica de Sincronización

#### 📥 Actualización de `crearTransaccionDePago()`

**Antes:**
```javascript
const nuevaTransaccion = new Transacciones({
  descripcion: this.formatearDescripcionPago(pago),
  monto: monto,
  // ... campos básicos
  origen: {
    tipo: 'MERCADOPAGO_PAGO',
    transaccionId: pago.id.toString()
  }
});
```

**Después:**
```javascript
const comisiones = this.calcularComisiones(pago);
const montoNeto = monto - comisiones.total;

const nuevaTransaccion = new Transacciones({
  descripcion: this.formatearDescripcionPago(pago),
  monto: monto,
  montoNeto: montoNeto,
  comisiones: comisiones,
  // ... campos básicos
  origen: {
    tipo: 'MERCADOPAGO_PAGO',
    transaccionId: pago.id.toString(),
    metadata: {
      paymentId: pago.id,
      status: pago.status,
      statusDetail: pago.status_detail,
      paymentMethod: pago.payment_method?.type,
      paymentMethodId: pago.payment_method_id,
      installments: pago.installments,
      currencyId: pago.currency_id,
      collectorId: pago.collector_id,
      payerId: pago.payer?.id,
      transactionAmount: pago.transaction_amount,
      netReceivedAmount: pago.transaction_details?.net_received_amount,
      totalPaidAmount: pago.transaction_details?.total_paid_amount
    }
  }
});
```

#### 🆕 Nuevo Método: `calcularComisiones(pago)`

```javascript
calcularComisiones(pago) {
  const comisiones = {
    mercadopago: 0,
    financieras: 0,
    envio: 0,
    total: 0
  };

  // MercadoPago devuelve las comisiones en fee_details
  if (pago.fee_details && Array.isArray(pago.fee_details)) {
    for (const fee of pago.fee_details) {
      const amount = Math.abs(fee.amount || 0);
      
      switch (fee.type) {
        case 'mercadopago_fee':
          comisiones.mercadopago += amount;
          break;
        case 'financing_fee':
          comisiones.financieras += amount;
          break;
        case 'shipping_fee':
          comisiones.envio += amount;
          break;
        default:
          comisiones.mercadopago += amount;
      }
    }
  }

  comisiones.total = comisiones.mercadopago + comisiones.financieras + comisiones.envio;
  return comisiones;
}
```

#### 📥 Actualización de `crearTransaccionDeMovimiento()`

Similar a pagos, ahora incluye:
- Campo `montoNeto`
- Objeto `comisiones` (inicializado en 0)
- Metadata adicional (`concept`)

---

### 4. **bankConnectionController.js** - Creación de Cuenta

#### 🏦 Actualización de Creación de Cuenta

**Antes:**
```javascript
const cuenta = new Cuentas({
  nombre: nombreCuenta,
  tipo: 'MERCADO_PAGO',
  moneda: moneda._id,
  usuario: req.user.id,
  saldo: 0,
  activo: true
});
```

**Después:**
```javascript
const cuenta = new Cuentas({
  nombre: nombreCuenta,
  tipo: 'MERCADO_PAGO',
  moneda: moneda._id,
  usuario: req.user.id,
  saldo: 0,
  activo: true,
  mercadopago: {
    userId: userId,
    email: userInfo?.email || null,
    nickname: userInfo?.nickname || null,
    countryId: userInfo?.country_id || pais,
    siteId: userInfo?.site_id || null,
    verificado: userInfo?.status?.verified || false
  }
});
```

---

## 📊 Ejemplo de Transacción Completa

### Estructura de una Transacción de MercadoPago:

```json
{
  "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
  "descripcion": "MercadoPago - Venta de producto",
  "monto": 1000.00,
  "montoNeto": 965.00,
  "comisiones": {
    "mercadopago": 30.00,
    "financieras": 5.00,
    "envio": 0.00,
    "total": 35.00
  },
  "fecha": "2025-10-28T10:30:00.000Z",
  "categoria": "Otro",
  "estado": "COMPLETADA",
  "tipo": "INGRESO",
  "usuario": "689ab5422ffb64d7c6de6995",
  "cuenta": "67a1b2c3d4e5f6g7h8i9j0k2",
  "moneda": "67a1b2c3d4e5f6g7h8i9j0k3",
  "origen": {
    "tipo": "MERCADOPAGO_PAGO",
    "transaccionId": "12345678901",
    "metadata": {
      "paymentId": 12345678901,
      "status": "approved",
      "statusDetail": "accredited",
      "paymentMethod": "credit_card",
      "paymentMethodId": "master",
      "installments": 1,
      "currencyId": "ARS",
      "collectorId": 156408816,
      "payerId": 987654321,
      "transactionAmount": 1000.00,
      "netReceivedAmount": 965.00,
      "totalPaidAmount": 1000.00
    }
  }
}
```

### Estructura de una Cuenta MercadoPago:

```json
{
  "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
  "nombre": "MercadoPago - POLOATT",
  "tipo": "MERCADO_PAGO",
  "numero": "ACC-1730000000000",
  "saldo": 0,
  "activo": true,
  "usuario": "689ab5422ffb64d7c6de6995",
  "moneda": "67a1b2c3d4e5f6g7h8i9j0k3",
  "mercadopago": {
    "userId": "156408816",
    "email": "polo@poloatt.com",
    "nickname": "POLOATT",
    "countryId": "AR",
    "siteId": "MLA",
    "verificado": true,
    "disponibleRetiro": 5000.00,
    "disponiblePendiente": 1500.00
  }
}
```

---

## 🔍 Casos de Uso

### 1. **Venta con Comisión**
```
Monto Bruto: $1,000.00
Comisión MP: $30.00
Comisión Financiera: $5.00
─────────────────────
Monto Neto: $965.00
```

### 2. **Compra del Usuario**
```
Tipo: EGRESO
Monto: $500.00
Comisiones: $0.00 (el vendedor paga)
Monto Neto: $500.00
```

### 3. **Movimiento de Cuenta**
```
Tipo: MERCADOPAGO_MOVIMIENTO
Ejemplos:
  - Retiros a banco
  - Depósitos
  - Transferencias entre cuentas
```

---

## 🚀 Beneficios de los Cambios

### Para el Usuario:
- ✅ **Transparencia Total**: Ven exactamente cuánto les cobra MercadoPago
- ✅ **Análisis Preciso**: Pueden calcular ganancias netas reales
- ✅ **Historial Completo**: Toda la información de cada transacción

### Para el Sistema:
- ✅ **Trazabilidad**: Distinguir entre tipos de transacciones MercadoPago
- ✅ **Integridad**: Validación automática con enum
- ✅ **Escalabilidad**: Preparado para webhooks y actualizaciones en tiempo real
- ✅ **Compatibilidad**: Soporte para múltiples tipos de transacciones

### Para Desarrollo:
- ✅ **Type Safety**: Enums previenen errores de tipeo
- ✅ **Debugging**: Metadata completa para troubleshooting
- ✅ **Extensibilidad**: Fácil agregar más campos en el futuro

---

## 📝 Notas Importantes

### Migración de Datos Existentes
Si ya existen transacciones de MercadoPago con `origen.tipo: 'MERCADOPAGO'`:
```javascript
// No es necesario migrar, el enum incluye 'MERCADOPAGO' genérico
// Las nuevas transacciones usarán los tipos específicos
```

### Retrocompatibilidad
- ✅ El tipo `'MERCADOPAGO'` genérico sigue siendo válido
- ✅ Los nuevos tipos son adicionales, no reemplazan
- ✅ No se requiere migración de datos existentes

### Campos Opcionales
Todos los nuevos campos son opcionales excepto los ya requeridos:
- `comisiones.*`: Default 0
- `montoNeto`: Puede ser `null` o `undefined`
- `mercadopago.*`: Todos opcionales

---

## ✅ Testing Recomendado

1. **Crear conexión MercadoPago nueva**
   - Verificar que se creen los campos `mercadopago.*`
   
2. **Sincronizar transacciones**
   - Verificar cálculo de comisiones
   - Verificar `montoNeto`
   - Verificar metadata completa

3. **Consultar transacciones**
   - Filtrar por `origen.tipo: 'MERCADOPAGO_PAGO'`
   - Filtrar por `origen.tipo: 'MERCADOPAGO_MOVIMIENTO'`
   - Sumar comisiones por período

4. **Actualizar saldo de cuenta**
   - Considerar `montoNeto` en lugar de `monto` para cálculos reales

---

## 🔗 Archivos Modificados

1. ✅ `apps/backend/src/models/Transacciones.js`
2. ✅ `apps/backend/src/models/Cuentas.js`
3. ✅ `apps/backend/src/services/mercadoPagoDataService.js`
4. ✅ `apps/backend/src/controllers/bankConnectionController.js`

---

## 📚 Referencias

- [MercadoPago API - Payments](https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get)
- [MercadoPago API - Account Money](https://www.mercadopago.com.ar/developers/es/reference/account_money/_account_money/get)
- [MercadoPago Fee Details](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/payment-management/get-payment)

---

**✨ Actualizaciones completadas exitosamente - Sistema listo para sincronización completa con MercadoPago**

