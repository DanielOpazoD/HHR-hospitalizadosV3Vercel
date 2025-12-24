# Arquitectura del Proyecto HHR-Hospitalizados

Sistema de gestión de censo diario de pacientes hospitalizados para el Hospital Hanga Roa.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilos | TailwindCSS |
| Estado | React Context + Custom Hooks |
| Base de datos | Firebase Firestore |
| Autenticación | Firebase Auth |
| Hosting | Netlify |
| Correo | Gmail API (Netlify Functions) |

---

## Estructura de Directorios

```
├── App.tsx                 # Componente principal, routing
├── components/
│   ├── auth/              # LoginPage
│   ├── census/            # PatientRow, CensusEmailConfigModal
│   │   └── patient-row/   # Sub-componentes de celdas
│   ├── debug/             # TestAgent, DemoModePanel
│   ├── layout/            # Navbar, DateStrip, SummaryCard
│   ├── modals/            # Modales de acción (alta, traslado, etc)
│   ├── shared/            # ErrorBoundaries, SyncWatcher
│   └── ui/                # Primitivos (DebouncedInput, ViewLoader)
├── views/
│   ├── admin/             # AuditView, MedicalSignatureView
│   ├── analytics/         # AnalyticsView
│   ├── census/            # CensusView + sub-componentes
│   ├── cudyr/             # CudyrView
│   ├── handoff/           # HandoffView
│   ├── reports/           # ReportsView
│   └── whatsapp/          # WhatsAppIntegrationView
├── hooks/
│   ├── useDailyRecord.ts  # Orquestador principal
│   ├── useDailyRecordSync.ts # Sync con Firebase
│   ├── useBedManagement.ts
│   ├── useAuthState.ts
│   └── useCensusEmail.ts
├── services/
│   ├── admin/             # auditService
│   ├── auth/              # authService
│   ├── exporters/         # Excel/CSV exports
│   ├── storage/           # firestoreService, localStorageService
│   ├── integrations/      # geminiService, censusEmailService
│   ├── repositories/      # DailyRecordRepository
│   └── dataService.ts     # Utilidades de datos
├── context/               # React Contexts
├── constants/             # Configuración, beds, email
├── schemas/               # Zod validation schemas
├── types/                 # TypeScript types
├── utils/                 # Utilidades puras
└── tests/
    ├── hooks/
    ├── services/
    ├── components/
    └── integration/
```

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│                      App.tsx                        │
│  ┌─────────────────────────────────────────────┐   │
│  │           DailyRecordProvider               │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │        useDailyRecord (hook)         │   │   │
│  │  │  ┌─────────────────────────────┐     │   │   │
│  │  │  │   useDailyRecordSync        │◄────┼───┼───┼──► Firebase
│  │  │  └─────────────────────────────┘     │   │   │
│  │  │  ┌─────────────────────────────┐     │   │   │
│  │  │  │   useBedManagement          │     │   │   │
│  │  │  │   usePatientDischarges      │     │   │   │
│  │  │  │   usePatientTransfers       │     │   │   │
│  │  │  └─────────────────────────────┘     │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Views (lazy loaded)             │  │
│  │  CensusView │ HandoffView │ AnalyticsView    │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Patrones de Diseño

### 1. Composición de Hooks
El hook `useDailyRecord` orquesta múltiples hooks especializados:
- `useDailyRecordSync` → Sincronización Firebase
- `useBedManagement` → Operaciones de camas
- `usePatientDischarges` → Altas
- `usePatientTransfers` → Traslados

### 2. Repository Pattern
`DailyRecordRepository` abstrae el acceso a datos:
- localStorage (offline-first)
- Firestore (sync en background)
- Demo mode (datos aislados)

### 3. Barrel Files
Cada subdirectorio tiene `index.ts` para exports limpios:
```typescript
import { auditService } from '../services/admin';
```

---

## Módulos Principales

| Módulo | Descripción |
|--------|-------------|
| **Census** | Gestión del censo diario de camas |
| **Handoff** | Entrega de turno enfermería/médico |
| **CUDYR** | Scoring de dependencia/riesgo |
| **Analytics** | Estadísticas históricas |
| **Reports** | Exportación Excel/PDF |
| **Audit** | Log de acciones críticas |

---

## Variables de Entorno

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=

# Gmail API (Netlify Functions)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
```

---

## Despliegue

1. **Netlify**: Auto-deploy desde `main`
2. **Netlify Functions**: `netlify/functions/send-census-email.ts`
3. **Firebase**: Firestore rules en `firestore.rules`

---

*Última actualización: Diciembre 2024*
