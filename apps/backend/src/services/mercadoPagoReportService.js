import fetch from 'node-fetch';
import { mpAuthHeaders } from './mercadoPagoUtils.js';
import { parseSettlementCsv } from './mercadoPagoCsvParser.js';

const MP_BASE = 'https://api.mercadopago.com';

export function getSettlementPollConfig() {
  return {
    pollIntervalMs: parseInt(process.env.MP_SETTLEMENT_POLL_INTERVAL_MS || '3000', 10),
    maxPollAttempts: parseInt(process.env.MP_SETTLEMENT_MAX_POLL_ATTEMPTS || '40', 10),
    pendingMaxAgeMs: parseInt(
      process.env.MP_SETTLEMENT_PENDING_MAX_AGE_MS || String(24 * 60 * 60 * 1000),
      10
    )
  };
}

export class SettlementReportTimeoutError extends Error {
  constructor(message, { beginDate, endDate } = {}) {
    super(message);
    this.name = 'SettlementReportTimeoutError';
    this.beginDate = beginDate;
    this.endDate = endDate;
  }
}

export class MercadoPagoReportService {
  constructor({ accessToken, userId }) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  async configureReport() {
    const body = {
      file_name_prefix: `attadia-settlement-${this.userId}`,
      show_fee_prevision: false,
      show_chargeback_cancel: true,
      include_withdraw: true,
      coupon_detailed: true,
      shipping_detail: true,
      refund_detailed: true,
      header_language: 'es',
      separator: ';',
      columns: [
        { key: 'TRANSACTION_DATE' },
        { key: 'SOURCE_ID' },
        { key: 'EXTERNAL_REFERENCE' },
        { key: 'TRANSACTION_TYPE' },
        { key: 'TRANSACTION_AMOUNT' },
        { key: 'FEE_AMOUNT' },
        { key: 'SETTLEMENT_NET_AMOUNT' },
        { key: 'PAYMENT_METHOD' },
        { key: 'PAYMENT_METHOD_TYPE' }
      ]
    };

    const response = await fetch(`${MP_BASE}/v1/account/settlement_report/config`, {
      method: 'POST',
      headers: mpAuthHeaders(this.accessToken),
      body: JSON.stringify(body)
    });

    if (response.status === 200 || response.status === 201) {
      return response.json();
    }

    const errorText = await response.text();
    if (response.status === 409 || errorText.includes('already')) {
      console.log('[MP Report] Configuración de reporte ya existe, continuando...');
      return null;
    }

    console.warn('[MP Report] Error configurando reporte:', response.status, errorText);
    return null;
  }

  async createReport(beginDate, endDate) {
    const response = await fetch(`${MP_BASE}/v1/account/settlement_report`, {
      method: 'POST',
      headers: mpAuthHeaders(this.accessToken),
      body: JSON.stringify({
        begin_date: beginDate,
        end_date: endDate
      })
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (response.status !== 202 && response.status !== 200 && response.status !== 203) {
      throw new Error(`Error creando reporte settlement: ${response.status} - ${text}`);
    }

    return { status: response.status, data };
  }

  async listReports() {
    const response = await fetch(`${MP_BASE}/v1/account/settlement_report/list`, {
      headers: mpAuthHeaders(this.accessToken)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error listando reportes: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  async downloadReport(fileName) {
    const encoded = encodeURIComponent(fileName);
    const response = await fetch(`${MP_BASE}/v1/account/settlement_report/${encoded}`, {
      headers: { Authorization: `Bearer ${this.accessToken}`, 'User-Agent': 'Attadia/1.0' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error descargando reporte: ${response.status} - ${errorText}`);
    }

    return response.text();
  }

  async waitForReportFile(beginDate, endDate, options = {}) {
    const { pollIntervalMs, maxPollAttempts } = { ...getSettlementPollConfig(), ...options };

    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
      }

      const reports = await this.listReports();
      const match = reports.find((r) => {
        const sameBegin = r.begin_date?.startsWith(beginDate.slice(0, 10));
        const sameEnd = r.end_date?.startsWith(endDate.slice(0, 10));
        return r.file_name && (sameBegin || sameEnd || r.created_from === 'manual');
      });

      if (match?.file_name) {
        return match.file_name;
      }
    }

    const reports = await this.listReports();
    const latest = reports.find((r) => r.file_name);
    if (latest?.file_name) {
      return latest.file_name;
    }

    throw new SettlementReportTimeoutError(
      'Timeout esperando generación del reporte settlement',
      { beginDate, endDate }
    );
  }

  async completeReport(beginDate, endDate, pollOptions = {}) {
    const fileName = await this.waitForReportFile(beginDate, endDate, pollOptions);
    const csvText = await this.downloadReport(fileName);
    const rows = parseSettlementCsv(csvText);
    return { rows, fileName, total: rows.length };
  }

  async requestReport(beginDate, endDate) {
    await this.configureReport();
    return this.createReport(beginDate, endDate);
  }

  /**
   * Intenta completar un reporte solicitado previamente (job async en background).
   */
  async tryCompletePendingReport(pending, pollOptions = {}) {
    if (!pending?.beginDate || !pending?.endDate) {
      return null;
    }

    const { pendingMaxAgeMs } = getSettlementPollConfig();
    if (pending.solicitadoEn) {
      const age = Date.now() - new Date(pending.solicitadoEn).getTime();
      if (age > pendingMaxAgeMs) {
        return { expired: true, pending };
      }
    }

    try {
      const result = await this.completeReport(pending.beginDate, pending.endDate, pollOptions);
      return { ...result, completed: true };
    } catch (error) {
      if (error instanceof SettlementReportTimeoutError) {
        return { completed: false, pending, error: error.message };
      }
      throw error;
    }
  }

  /**
   * Flujo completo: configura, crea y espera el reporte.
   * Si el poll agota el timeout, devuelve { pending: true } para completar en próxima sync.
   */
  async fetchSettlementMovements(beginDate, endDate, options = {}) {
    const pollOptions = options.pollOptions || {};

    if (options.pending) {
      const pendingResult = await this.tryCompletePendingReport(options.pending, pollOptions);
      if (pendingResult?.completed) {
        return {
          rows: pendingResult.rows,
          fileName: pendingResult.fileName,
          total: pendingResult.total,
          fromPending: true
        };
      }
      if (pendingResult?.expired) {
        console.log('[MP Report] Reporte pendiente expirado, solicitando uno nuevo...');
      } else if (pendingResult && !pendingResult.completed) {
        return {
          rows: [],
          pending: true,
          beginDate: options.pending.beginDate,
          endDate: options.pending.endDate
        };
      }
    }

    await this.requestReport(beginDate, endDate);

    try {
      const result = await this.completeReport(beginDate, endDate, pollOptions);
      return result;
    } catch (error) {
      if (error instanceof SettlementReportTimeoutError) {
        return {
          rows: [],
          pending: true,
          beginDate,
          endDate
        };
      }
      throw error;
    }
  }

  parseCsvContent(csvText) {
    return parseSettlementCsv(csvText);
  }
}
