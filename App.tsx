import React, { useState, Suspense, lazy } from 'react';
import { useDailyRecord, useAuthState, useDateNavigation, useFileOperations, useExistingDays } from './hooks';
import { useStorageMigration } from './hooks/useStorageMigration';
import { DailyRecordProvider, RoleProvider, StaffProvider } from './context';
import { Navbar, DateStrip, SettingsModal, TestAgent, SyncWatcher, DemoModePanel, LoginPage, ErrorBoundary } from './components';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import type { ModuleType } from './components';
import { canEditModule } from './utils/permissions';
import { firebaseInitError } from './firebaseConfig';

// ========== LAZY LOADED VIEWS ==========
// These views are loaded on-demand when the user navigates to them
// Using webpackPrefetch to load modules in idle time
const CensusView = lazy(() => import(/* webpackPrefetch: true */ './views/CensusView').then(m => ({ default: m.CensusView })));
const CudyrView = lazy(() => import(/* webpackPrefetch: true */ './views/CudyrView').then(m => ({ default: m.CudyrView })));
const HandoffView = lazy(() => import(/* webpackPrefetch: true */ './views/HandoffView').then(m => ({ default: m.HandoffView })));
const ReportsView = lazy(() => import(/* webpackChunkName: "reports" */ './views/ReportsView').then(m => ({ default: m.ReportsView })));
const AuditView = lazy(() => import(/* webpackChunkName: "audit" */ './views/AuditView').then(m => ({ default: m.AuditView })));
const MedicalSignatureView = lazy(() => import(/* webpackChunkName: "signature" */ './views/MedicalSignatureView').then(m => ({ default: m.MedicalSignatureView })));
const WhatsAppIntegrationView = lazy(() => import(/* webpackChunkName: "whatsapp" */ './views/whatsapp/WhatsAppIntegrationView').then(m => ({ default: m.WhatsAppIntegrationView })));

// ========== AUTH IMPORTS ==========
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebaseConfig';

// ==========LOADING FALLBACK ==========
// Optimized loading indicator with skeleton
const ViewLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] py-20">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin" />
      <span className="text-slate-500 text-sm font-medium">Cargando módulo...</span>
    </div>
  </div>
);

function App() {
  if (firebaseInitError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="max-w-xl bg-white shadow-md rounded-xl p-6 border border-slate-200 space-y-3 text-center">
          <h1 className="text-xl font-semibold text-slate-900">No se pudo cargar la aplicación</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Falta la configuración de Firebase necesaria para conectar con la base de datos. Agrega las variables
            <code className="bg-slate-100 px-1 mx-1 rounded">VITE_FIREBASE_* </code>
            en los ajustes de entorno de Netlify (o en un archivo <code className="bg-slate-100 px-1 mx-1 rounded">.env.local</code>)
            y vuelve a desplegar.
          </p>
          <p className="text-sm text-slate-500 break-words">
            Detalle técnico: {firebaseInitError.message}
          </p>
        </div>
      </div>
    );
  }

  // ========== STORAGE MIGRATION (runs once on startup) ==========
  useStorageMigration();

  // ========== AUTH STATE (extracted to hook) ==========
  const { user, authLoading, isFirebaseConnected, handleLogout, role, canEdit, isEditor, isViewer } = useAuthState();

  // ========== DATE NAVIGATION (extracted to hook) ==========
  const {
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedDay, setSelectedDay,
    daysInMonth,
    currentDateString: navDateString
  } = useDateNavigation();

  // ========== URL ROUTING (SIGNATURE MODE) ==========
  const urlParams = new URLSearchParams(window.location.search);
  const isSignatureMode = urlParams.get('mode') === 'signature';
  const signatureDate = urlParams.get('date');

  // Helper effect: Anonymous Login for Signature Mode
  React.useEffect(() => {
    if (isSignatureMode && !user && !authLoading) {
      signInAnonymously(auth).catch((err) => console.error("Anonymous auth failed", err));
    }
  }, [isSignatureMode, user, authLoading]);

  // Determine effective date
  const currentDateString = (isSignatureMode && signatureDate) ? signatureDate : navDateString;

  // ========== DAILY RECORD HOOK ==========
  const dailyRecordHook = useDailyRecord(currentDateString);
  const { record, refresh, syncStatus, lastSyncTime } = dailyRecordHook;

  // Calculate existing days (depends on record changes)
  const existingDaysInMonth = useExistingDays(selectedYear, selectedMonth, record);

  // ========== FILE OPERATIONS (extracted to hook) ==========
  const { handleExportJSON, handleExportCSV, handleImportJSON } = useFileOperations(record, refresh);

  // ========== UI STATE ==========
  const [currentModule, setCurrentModule] = useState<ModuleType>('CENSUS');
  const [censusViewMode, setCensusViewMode] = useState<'REGISTER' | 'ANALYTICS'>('REGISTER');
  const [showSettings, setShowSettings] = useState(false);
  const [isTestAgentRunning, setIsTestAgentRunning] = useState(false);
  const [showBedManager, setShowBedManager] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // ========== LOADING STATE ==========
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-medical-600 text-xl font-bold">Cargando...</div>
      </div>
    );
  }

  // ========== AUTH REQUIRED ==========
  // ========== AUTH REQUIRED ==========
  if (!user && !isSignatureMode) {
    return <LoginPage onLoginSuccess={() => { }} />;
  }

  // ========== MAIN RENDER ==========
  return (
    <RoleProvider role={role} canEdit={canEdit} isEditor={isEditor} isViewer={isViewer}>
      <DailyRecordProvider value={dailyRecordHook}>
        <StaffProvider>
          <div className="min-h-screen bg-slate-100 font-sans flex flex-col print:bg-white print:p-0">
            {!isSignatureMode && (
              <Navbar
                currentModule={currentModule}
                setModule={setCurrentModule}
                censusViewMode={censusViewMode}
                setCensusViewMode={setCensusViewMode}
                onPrint={() => window.print()}
                onOpenBedManager={() => setShowBedManager(true)}
                onExportJSON={handleExportJSON}
                onExportCSV={handleExportCSV}
                onImportJSON={handleImportJSON}
                onOpenSettings={() => setShowSettings(true)}
                userEmail={user?.email}
                onLogout={handleLogout}
                isFirebaseConnected={isFirebaseConnected}
              />
            )}

            {/* DateStrip - Only in REGISTER mode and NOT Signature Mode */}
            {censusViewMode === 'REGISTER' && !isSignatureMode && (
              <DateStrip
                selectedYear={selectedYear} setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
                selectedDay={selectedDay} setSelectedDay={setSelectedDay}
                currentDateString={currentDateString}
                daysInMonth={daysInMonth}
                existingDaysInMonth={existingDaysInMonth}
                onOpenBedManager={() => setShowBedManager(true)}
                onPrint={() => window.print()}
                syncStatus={syncStatus}
                lastSyncTime={lastSyncTime}
              />
            )}

            {/* Main Content Area with Lazy Loading */}
            <main className="max-w-screen-2xl mx-auto px-4 py-6 flex-1 w-full pb-20 print:p-0 print:pb-0 print:max-w-none">
              <ErrorBoundary>
                <Suspense fallback={<ViewLoader />}>
                  {isSignatureMode ? (
                    <MedicalSignatureView />
                  ) : (
                    <>
                      {currentModule === 'CENSUS' && (
                        <CensusView
                          viewMode={censusViewMode}
                          selectedDay={selectedDay}
                          selectedMonth={selectedMonth}
                          currentDateString={currentDateString}
                          onOpenBedManager={() => setShowBedManager(true)}
                          showBedManagerModal={showBedManager}
                          onCloseBedManagerModal={() => setShowBedManager(false)}
                          readOnly={!canEditModule(role, 'CENSUS')}
                        />
                      )}

                      {currentModule === 'CUDYR' && <CudyrView readOnly={!canEditModule(role, 'CUDYR')} />}
                      {currentModule === 'NURSING_HANDOFF' && <HandoffView type="nursing" readOnly={!canEditModule(role, 'NURSING_HANDOFF')} />}
                      {currentModule === 'MEDICAL_HANDOFF' && <HandoffView type="medical" readOnly={!canEditModule(role, 'MEDICAL_HANDOFF')} />}
                      {currentModule === 'REPORTS' && <ReportsView />}
                      {currentModule === 'AUDIT' && <AuditView />}
                      {currentModule === 'WHATSAPP' && <WhatsAppIntegrationView />}
                    </>
                  )}
                </Suspense>
              </ErrorBoundary>
            </main>

            {/* Global Modals */}
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              onGenerateDemo={() => setShowDemoPanel(true)}
              onRunTest={() => setIsTestAgentRunning(true)}
            />

            <TestAgent
              isRunning={isTestAgentRunning}
              onComplete={() => setIsTestAgentRunning(false)}
              currentRecord={record}
            />
          </div>

          <SyncWatcher />
          <DemoModePanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />
        </StaffProvider>
      </DailyRecordProvider>
    </RoleProvider>
  );
}

// Wrap entire app with Global Error Boundary
const AppWithErrorBoundary = () => (
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

export default AppWithErrorBoundary;

