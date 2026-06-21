/**
 * Parser para reportes Account Money (CSV) de Mercado Pago.
 * Usado tanto para descargas vía API como importación manual.
 */

function detectSeparator(headerLine) {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function parseCsvLine(line, separator) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseSettlementCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return [];
  }

  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const separator = detectSeparator(lines[0]);
  const headers = parseCsvLine(lines[0], separator).map((h) => h.toUpperCase());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], separator);
    if (values.length === 0) continue;

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    rows.push(normalizeSettlementRow(row));
  }

  return rows;
}

function normalizeSettlementRow(row) {
  const sourceId = row.SOURCE_ID || row.source_id || '';
  const netAmount = parseFloat(row.SETTLEMENT_NET_AMOUNT ?? row.settlement_net_amount ?? row.TRANSACTION_AMOUNT ?? 0);
  const grossAmount = parseFloat(row.TRANSACTION_AMOUNT ?? row.transaction_amount ?? Math.abs(netAmount));
  const feeAmount = Math.abs(parseFloat(row.FEE_AMOUNT ?? row.fee_amount ?? row.MKP_FEE_AMOUNT ?? 0));

  return {
    id: sourceId || `${row.TRANSACTION_DATE}-${netAmount}-${row.TRANSACTION_TYPE}`,
    sourceId,
    transactionType: row.TRANSACTION_TYPE || row.transaction_type || '',
    description: row.DESCRIPTION || row.description || '',
    paymentMethod: row.PAYMENT_METHOD || row.payment_method || '',
    paymentMethodType: row.PAYMENT_METHOD_TYPE || row.payment_method_type || '',
    amount: grossAmount,
    netAmount,
    feeAmount,
    currency: row.TRANSACTION_CURRENCY || row.SETTLEMENT_CURRENCY || row.transaction_currency || 'ARS',
    date: row.TRANSACTION_DATE || row.SETTLEMENT_DATE || row.transaction_date,
    externalReference: row.EXTERNAL_REFERENCE || row.external_reference || '',
    raw: row
  };
}

export function extractBalanceFromRows(rows) {
  if (!rows.length) {
    return { available: null, unavailable: null };
  }

  const sorted = [...rows].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastNet = sorted.reduce((sum, r) => sum + (r.netAmount || 0), 0);

  return {
    available: lastNet,
    unavailable: 0
  };
}
