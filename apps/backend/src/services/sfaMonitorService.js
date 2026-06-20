/**
 * Monitoreo del estado Open Finance Argentina (SFA / BCRA).
 * La API 1.0 aún no está publicada — este módulo expone el estado conocido
 * y sirve como punto de extensión cuando el BCRA publique specs.
 */

const SFA_MONITOR = {
  phase: 'PRE_LAUNCH',
  apiVersion: null,
  integrationEnabled: false,
  expectedRelease: '2026',
  regulatoryFramework: 'Decreto 353/2025 — Sistema de Finanzas Abiertas (SFA)',
  sources: [
    {
      id: 'bcra_sfa',
      name: 'BCRA — SFA API',
      url: 'https://www.bcra.gob.ar/',
      status: 'pending_publication',
      note: 'API 1.0 prevista 2026; sin endpoint público operativo a junio 2026'
    },
    {
      id: 'open_finance_ar_doc',
      name: 'Attadia OPEN_FINANCE_AR.md',
      path: 'apps/backend/docs/OPEN_FINANCE_AR.md',
      status: 'documented'
    }
  ],
  checklist: [
    { id: 'bcra_api_spec', label: 'Publicación BCRA SFA API 1.0', done: false },
    { id: 'tpp_registration', label: 'Registro Attadia como participante/receptor', done: false },
    { id: 'consent_ui', label: 'UI consentimiento y revocación', done: false },
    { id: 'sfa_adapter', label: 'Adapter SFA (cuentas, saldos, transacciones)', done: false },
    { id: 'migrate_mp_sync', label: 'Migrar sync MP de CSV a APIs SFA', done: false }
  ],
  currentMpStrategy: [
    'OAuth read + payments/search dual',
    'Account Money Report API (settlement_report async)',
    'Import CSV manual como fallback',
    'No email parsing'
  ]
};

export async function getSfaMonitorStatus() {
  const enabled = process.env.OPEN_FINANCE_SFA_ENABLED === 'true';

  return {
    ...SFA_MONITOR,
    integrationEnabled: enabled,
    lastChecked: new Date().toISOString(),
    nextAction: enabled
      ? 'Implementar adapter cuando BCRA publique OpenAPI/Swagger SFA 1.0'
      : 'Monitorear BCRA; mantener Fase 1 MP (settlement + CSV)',
    implementationReady: false
  };
}

export function isSfaIntegrationEnabled() {
  return process.env.OPEN_FINANCE_SFA_ENABLED === 'true';
}
