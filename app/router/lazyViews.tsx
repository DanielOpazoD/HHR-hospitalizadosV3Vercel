import { lazy } from 'react';

export const CensusViewLazy = lazy(() => import(/* webpackPrefetch: true */ '../../views/CensusView').then(m => ({ default: m.CensusView })));
export const CudyrViewLazy = lazy(() => import(/* webpackPrefetch: true */ '../../views/CudyrView').then(m => ({ default: m.CudyrView })));
export const HandoffViewLazy = lazy(() => import(/* webpackPrefetch: true */ '../../views/HandoffView').then(m => ({ default: m.HandoffView })));
export const ReportsViewLazy = lazy(() => import(/* webpackChunkName: "reports" */ '../../views/ReportsView').then(m => ({ default: m.ReportsView })));
export const AuditViewLazy = lazy(() => import(/* webpackChunkName: "audit" */ '../../views/AuditView').then(m => ({ default: m.AuditView })));
export const MedicalSignatureViewLazy = lazy(() => import(/* webpackChunkName: "signature" */ '../../views/MedicalSignatureView').then(m => ({ default: m.MedicalSignatureView })));
export const WhatsAppIntegrationViewLazy = lazy(() => import(/* webpackChunkName: "whatsapp" */ '../../views/whatsapp/WhatsAppIntegrationView').then(m => ({ default: m.WhatsAppIntegrationView })));
