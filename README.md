# Hospital Hanga Roa - Sistema de Gestión Clínica

![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)
![License](https://img.shields.io/badge/license-Private-red)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

Sistema integral de gestión hospitalaria para el Hospital Hanga Roa de Isla de Pascua, desarrollado con React, TypeScript y Firebase.

## 🚀 Características Principales

- **📋 Censo Diario**: Registro completo de pacientes hospitalizados con tracking en tiempo real
- **🏥 CUDYR**: Sistema de categorización de pacientes y registro de urgencias
- **🔄 Entrega de Turno Digital**: Handoff médico y de enfermería con checklist y firmas digitales
- **📊 Reportes**: Exportación automática a Excel y PDF con análisis estadístico
- **🔐 Control de Acceso (RBAC)**: Sistema de permisos basado en roles
- **📝 Auditoría**: Registro completo de todas las acciones críticas
- **📱 Modo Offline**: Sincronización automática cuando vuelve la conexión
- **🔒 Validación de Datos**: Esquemas Zod para integridad de datos
- **🧪 Testing**: 86+ tests automatizados (unitarios, integración, E2E)

---

## 📁 Arquitectura del Proyecto

### Estructura de Directorios

```
├── components/             # Componentes reutilizables
│   ├── ui/                # Componentes UI base
│   ├── modals/            # Modales del sistema
│   ├── patient-row/       # Componentes de fila de paciente
│   └── GlobalErrorBoundary.tsx
├── context/               # React Contexts para estado global
│   ├── DailyRecordContext.tsx
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   └── ConfirmDialogContext.tsx
├── hooks/                 # Custom hooks
│   ├── useDailyRecord.ts       # Hook principal
│   ├── useBedManagement.ts     # Gestión de camas
│   ├── usePatientDischarges.ts # Altas
│   ├── usePatientTransfers.ts  # Traslados
│   └── useCensusLogic.ts       # Lógica de censo
├── services/              # Lógica de negocio
│   ├── calculations/      # Cálculos (estadísticas, CUDYR)
│   ├── repositories/      # Acceso a datos (Firebase)
│   ├── storage/           # Persistencia local
│   ├── authService.ts     # Autenticación
│   └── errorService.ts    # Manejo de errores
├── views/                 # Vistas/páginas principales
│   ├── CensusView.tsx
│   ├── CudyrView.tsx
│   ├── HandoffView.tsx
│   └── ReportsView.tsx
├── utils/                 # Utilidades
│   ├── permissions.ts     # RBAC
│   └── validation.ts      # Esquemas Zod
└── types/                 # TypeScript types
    └── index.ts

```

### Flujo de Datos

```
Usuario → View → Context → Hook → Service → Firebase
                    ↓         ↓        ↓
                 Estado → Validación → Logs
```

**1. Vista (View)**: Muestra UI, captura input del usuario  
**2. Context**: Provee estado global accesible desde anywhere  
**3. Hook**: Lógica de negocio, orquestación de acciones  
**4. Service**: Comunicación con Firebase, cálculos  
**5. Validación**: Zod schemas antes de escribir a Firebase  
**6. Error Handling**: Captura y logging centralizado  

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Frontend** | React | 19.2 |
| **Language** | TypeScript | 5.8 |
| **Build** | Vite | 6.2 |
| **Backend** | Firebase | 12.6 |
| **Database** | Firestore | - |
| **Auth** | Firebase Auth | - |
| **Testing** | Vitest | 4.0 |
| **E2E Testing** | Playwright | 1.57 |
| **Validation** | Zod | 3.25 |
| **Styling** | Vanilla CSS | - |
| **CI/CD** | GitHub Actions + Vercel | - |

---

## 📋 Requisitos del Sistema

- **Node.js**: 20.x o superior
- **npm**: 9.x o superior
- **Navegador**: Chrome/Firefox/Safari (últimas 2 versiones)
- **Conexión**: Internet (modo offline limitado)

---

## 🏃‍♂️ Inicio Rápido

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/hospital-hanga-roa.git
cd hospital-hanga-roa

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase
```

### Variables de Entorno

Crea un archivo `.env` con:

```env
VITE_FIREBASE_API_KEY=tu_api_key_firebase
# o bien en base64 si prefieres no usar texto plano en local:
# VITE_FIREBASE_API_KEY_B64=tu_api_key_firebase_codificada_en_base64
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
GEMINI_API_KEY=tu_gemini_api_key_opcional
```

> 💡 La API key se carga en tiempo de ejecución desde una función serverless de Netlify, por lo que no se incluye en el bundle ni en los assets públicos.
> Si prefieres evitar copiarla en texto plano en `.env`, codifícala en base64 y usa `VITE_FIREBASE_API_KEY_B64`:
> `echo -n "AIza..." | base64`

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir http://localhost:3000
```

### Testing

```bash
# Tests unitarios e integración
npm test

# Tests con coverage
npm test -- --coverage

# Tests E2E con Playwright
npx playwright test

# Tests E2E en modo UI
npx playwright test --ui
```

### Build y Deploy

```bash
# Build para producción
npm run build

# Preview del build
npm run preview

# Deploy a Vercel (automático en push a main)
git push origin main
```

---

## 🔐 Roles y Permisos

| Rol | Permisos | Email Example |
|-----|----------|---------------|
| **Admin** | Acceso total, configuración, auditoría | `daniel.opazo@hospitalhangaroa.cl` |
| **Enfermera Hospital** | Editar Censo, CUDYR, Entrega Enfermería | `hospitalizados@hospitalhangaroa.cl` |
| **Médico Urgencia** | Solo lectura (Censo, Entregas) | `d.opazo.damiani@gmail.com` |
| **Viewer** | Solo lectura Censo | Cualquier usuario autorizado |

### Matriz de Permisos

| Módulo | Admin | Enfermera | Médico | Viewer |
|--------|-------|-----------|--------|--------|
| Censo | ✅ Edit | ✅ Edit | 👁️ View | 👁️ View |
| CUDYR | ✅ Edit | ✅ Edit | ❌ | ❌ |
| Entrega Enfermería | ✅ Edit | ✅ Edit | 👁️ View | ❌ |
| Entrega Médica | ✅ Edit | 👁️ View | 👁️ View | ❌ |
| Reportes | ✅ Edit | 👁️ View | ❌ | ❌ |
| Auditoría | ✅ View | ❌ | ❌ | ❌ |

---

## 🧪 Testing

### Cobertura Actual

- **Total**: 86+ tests pasando
- **Unitarios**: 50+ (permissions, calculations, helpers)
- **Componentes**: 15+ (PatientRow, modals, UI)
- **Integración**: 10+ (patient flow, sync)
- **E2E**: 3 (complete workflows)

### Ejecutar Tests Específicos

```bash
# Solo tests de permisos
npm test -- tests/permissions.test.ts

# Solo tests de cálculos
npm test -- tests/statsCalculator.test.ts

# E2E en Chrome solamente
npx playwright test --project=chromium
```

---

## 📊 Características Técnicas Destacadas

### 1. **Optimización de Renderizado**
- React.memo en `PatientRow` (previene re-renders innecesarios)
- useCallback en todos los handlers
- Lazy loading de vistas

### 2. **Validación de Datos**
- Esquemas Zod para todos los tipos de datos
- Validación antes de cada escritura a Firebase
- Mensajes de error user-friendly

### 3. **Manejo de Errores**
- Error boundary global
- ErrorService centralizado
- Logging con contexto completo
- Preparado para Sentry

### 4. **Seguridad**
- Firestore Security Rules en backend
- RBAC en cliente
- No hay datos sensibles en código
- Headers de seguridad en Vercel

### 5. **CI/CD**
- Tests automáticos en cada push
- Preview deployments en PRs
- Deploy automático a producción

---

## 📚 Documentación Adicional

- [Guía de CI/CD](docs/cicd-setup-guide.md)
- [Security Rules](docs/firestore-security-guide.md)
- [Error Monitoring](docs/error-monitoring-guide.md)
- [Guía de Contribución](CONTRIBUTING.md)

---

## 🤝 Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de desarrollo.

---

## 📝 Licencia

Propiedad del Hospital Hanga Roa. Uso privado.

---

## 👥 Contacto

**Desarrollador**: Dr. Daniel Opazo  
**Email**: daniel.opazo@hospitalhangaroa.cl  
**Hospital**: Hospital Hanga Roa, Isla de Pascua, Chile

---

## 🙏 Agradecimientos

- Equipo de enfermería del Hospital Hanga Roa
- Personal médico colaborador
- Comunidad de Rapa Nui

│   ├── PatientRow.tsx
│   ├── Navbar.tsx
│   ├── DateStrip.tsx
│   └── SyncWatcher.tsx        # Observa sync y muestra toasts
│
├── views/
│   ├── census/                # Sub-componentes del censo
│   ├── cudyr/                 # Sub-componentes CUDYR
│   ├── handoff/               # Sub-componentes entrega de turno
│   └── [View].tsx             # Vistas principales
│
├── hooks/
│   ├── useDailyRecord.ts      # Hook principal de datos
│   ├── useBedManagement.ts    # Gestión de camas
│   ├── useClinicalCrib.ts     # Cunas clínicas
│   ├── usePatientDischarges.ts
│   ├── usePatientTransfers.ts
│   └── useNurseManagement.ts
│
├── services/
│   ├── storage/
│   │   └── localStorageService.ts   # Persistencia local
│   ├── repositories/
│   │   └── DailyRecordRepository.ts # Patrón Repository
│   ├── factories/
│   │   └── patientFactory.ts        # Creación de pacientes
│   ├── calculations/
│   │   └── statsCalculator.ts       # Estadísticas
│   ├── utils/
│   │   ├── dateFormatter.ts
│   │   └── demoDataGenerator.ts
│   ├── firestoreService.ts          # Firebase sync
│   └── dataService.ts               # Barrel export (legacy)
│
├── context/
│   ├── DailyRecordContext.tsx
│   ├── ConfirmDialogContext.tsx
│   └── NotificationContext.tsx
│
├── types/
│   ├── index.ts                     # Tipos principales
│   └── valueTypes.ts                # Tipos de valores
│
└── tests/
    ├── statsCalculator.test.ts
    ├── cudyrScoreUtils.test.ts
    └── usePatientDischarges.test.ts
```

## 🏗️ Patrones de Diseño

### Repository Pattern
```typescript
// Acceso a datos unificado
import { DailyRecordRepository } from './services/repositories/DailyRecordRepository';

await DailyRecordRepository.save(record);
const record = DailyRecordRepository.getForDate('2024-01-15');
```

### Composición de Hooks
```typescript
// Hook principal compone sub-hooks
const dailyRecordHook = useDailyRecord(dateString);
// Internamente usa: useBedManagement, useClinicalCrib, usePatientDischarges, etc.
```

### Context para Estado Global
- `DailyRecordContext` - Estado del censo diario
- `ConfirmDialogContext` - Diálogos de confirmación
- `NotificationContext` - Toast notifications

## 🔄 Sincronización

- **localStorage** → Persistencia offline instantánea
- **Firestore** → Sincronización en tiempo real multi-usuario
- **SyncWatcher** → Observa errores y muestra toasts

## 🧪 Testing

```bash
npm run test        # Ejecutar tests
npm run test:watch  # Modo watch
```

Cobertura actual: ~35% (28 tests)

## 📊 Módulos

| Módulo | Descripción |
|--------|-------------|
| Censo Diario | Gestión de pacientes y camas |
| CUDYR | Evaluación de dependencia/riesgo |
| Entrega Turno | Resumen para cambio de turno |
| Reportes | Exportación PDF/Excel |
| Estadísticas | Métricas y análisis |

## 🛠️ Tecnologías

- **React 18** + TypeScript
- **Vite** (build)
- **Firebase** (auth + Firestore)
- **Tailwind CSS** (estilos)
- **Vitest** (testing)
- **Lucide React** (iconos)
