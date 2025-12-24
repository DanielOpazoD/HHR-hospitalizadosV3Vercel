/**
 * Lazy-loaded view components
 * Loaded on-demand when the user navigates to them
 */
import { lazy } from 'react';

// Census module (prefetch for faster navigation)
export const CensusView = lazy(() =>
    import(/* webpackPrefetch: true */ './census/CensusView').then(m => ({ default: m.CensusView }))
);

// CUDYR module (prefetch)
export const CudyrView = lazy(() =>
    import(/* webpackPrefetch: true */ './cudyr/CudyrView').then(m => ({ default: m.CudyrView }))
);

// Handoff module (prefetch)
export const HandoffView = lazy(() =>
    import(/* webpackPrefetch: true */ './handoff/HandoffView').then(m => ({ default: m.HandoffView }))
);

// Reports module
export const ReportsView = lazy(() =>
    import(/* webpackChunkName: "reports" */ './reports/ReportsView').then(m => ({ default: m.ReportsView }))
);

// Admin modules
export const AuditView = lazy(() =>
    import(/* webpackChunkName: "audit" */ './admin/AuditView').then(m => ({ default: m.AuditView }))
);

export const MedicalSignatureView = lazy(() =>
    import(/* webpackChunkName: "signature" */ './admin/MedicalSignatureView').then(m => ({ default: m.MedicalSignatureView }))
);

// WhatsApp module
export const WhatsAppIntegrationView = lazy(() =>
    import(/* webpackChunkName: "whatsapp" */ './whatsapp/WhatsAppIntegrationView').then(m => ({ default: m.WhatsAppIntegrationView }))
);
