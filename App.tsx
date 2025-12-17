import React, { useState, Suspense, lazy } from 'react';
import { useDailyRecord, useAuthState, useDateNavigation, useFileOperations, useExistingDays } from './hooks';
import { useStorageMigration } from './hooks/useStorageMigration';
import { DailyRecordProvider, RoleProvider, StaffProvider } from './context';
import { Navbar, DateStrip, SettingsModal, TestAgent, SyncWatcher, DemoModePanel, LoginPage, ErrorBoundary } from './components';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import type { ModuleType } from './components';
import { canEditModule } from './utils/permissions';
import { generateCensusMasterExcel, triggerCensusEmail, formatDate } from './services';
import { CensusEmailConfigModal } from './components/CensusEmailConfigModal';
import { buildCensusEmailBody, CENSUS_DEFAULT_RECIPIENTS } from './constants/email';

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

  const nurseSignature = React.useMemo(() => {
    if (!record) return '';
    const nightShift = record.nursesNightShift?.filter(n => n && n.trim()) || [];
    if (nightShift.length > 0) {
      return nightShift.join(' / ');
    }
    const nurses = record.nurses?.filter(n => n && n.trim()) || [];
    return nurses.join(' / ');
  }, [record]);

  const [emailRecipients, setEmailRecipients] = useState<string[]>(() => {
    if (typeof window === 'undefined') return CENSUS_DEFAULT_RECIPIENTS;
    const stored = window.localStorage.getItem('censusEmailRecipients');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {
        // ignore parsing errors and fallback to defaults
      }
    }
    return CENSUS_DEFAULT_RECIPIENTS;
  });
  const [emailMessage, setEmailMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('censusEmailMessage');
      if (stored) return stored;
    }
    return buildCensusEmailBody(currentDateString, nurseSignature);
  });
  const [emailMessageEdited, setEmailMessageEdited] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(window.localStorage.getItem('censusEmailMessage'));
    }
    return false;
  });
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  const handleSendCensusEmail = async () => {
    if (!record) {
      alert('No hay datos del censo para enviar.');
      return;
    }

    if (emailStatus === 'loading') return;

    const recipients = (emailRecipients || []).map(r => r.trim()).filter(Boolean);
    const resolvedRecipients = recipients.length > 0 ? recipients : CENSUS_DEFAULT_RECIPIENTS;
    const confirmationText = [
      `Enviar correo de censo del ${formatDate(currentDateString)}?`,
      `Destinatarios: ${resolvedRecipients.join(', ')}`,
      '',
      '¿Confirmas el envío?'
    ].join('\n');

    const confirmed = window.confirm(confirmationText);
    if (!confirmed) return;

    setEmailError(null);
    setEmailStatus('loading');

    try {
      const finalMessage = emailMessage?.trim() ? emailMessage : buildCensusEmailBody(currentDateString, nurseSignature);
      await triggerCensusEmail({
        date: currentDateString,
        record,
        recipients: resolvedRecipients,
        nursesSignature: nurseSignature || undefined,
        body: finalMessage,
        userEmail: user?.email,
        userRole: (user as any)?.role || role
      });
      setEmailStatus('success');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error enviando correo de censo', error);
      const message = error?.message || 'No se pudo enviar el correo.';
      setEmailError(message);
      setEmailStatus('error');
      alert(message);
    }
  };

  const handleEmailMessageChange = (value: string) => {
    setEmailMessage(value);
    setEmailMessageEdited(true);
  };

  const handleResetEmailMessage = () => {
    setEmailMessage(buildCensusEmailBody(currentDateString, nurseSignature));
    setEmailMessageEdited(false);
  };

  // ========== FILE OPERATIONS (extracted to hook) ==========
  const { handleExportJSON, handleExportCSV, handleImportJSON } = useFileOperations(record, refresh);

  // ========== UI STATE ==========
  const [currentModule, setCurrentModule] = useState<ModuleType>('CENSUS');
  const [censusViewMode, setCensusViewMode] = useState<'REGISTER' | 'ANALYTICS'>('REGISTER');
  const [showSettings, setShowSettings] = useState(false);
  const [isTestAgentRunning, setIsTestAgentRunning] = useState(false);
  const [showBedManager, setShowBedManager] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('censusEmailRecipients', JSON.stringify(emailRecipients));
    }
  }, [emailRecipients]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('censusEmailMessage', emailMessage);
    }
  }, [emailMessage]);

  React.useEffect(() => {
    if (!emailMessageEdited) {
      setEmailMessage(buildCensusEmailBody(currentDateString, nurseSignature));
    }
  }, [currentDateString, nurseSignature, emailMessageEdited]);

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
                onExportExcel={currentModule === 'CENSUS'
                  ? () => generateCensusMasterExcel(selectedYear, selectedMonth, selectedDay)
                  : undefined}
                onConfigureEmail={currentModule === 'CENSUS' ? () => setShowEmailConfig(true) : undefined}
                onSendEmail={currentModule === 'CENSUS' ? handleSendCensusEmail : undefined}
                emailStatus={emailStatus}
                emailErrorMessage={emailError}
                syncStatus={syncStatus}
                lastSyncTime={lastSyncTime}
              />
            )}

            {/* Main Content Area with Lazy Loading */}
            <main className="max-w-screen-2xl mx-auto px-4 pt-4 pb-20 flex-1 w-full print:p-0 print:pb-0 print:max-w-none">
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

            <CensusEmailConfigModal
              isOpen={showEmailConfig}
              onClose={() => setShowEmailConfig(false)}
              recipients={emailRecipients}
              onRecipientsChange={(value) => setEmailRecipients(value)}
              message={emailMessage}
              onMessageChange={handleEmailMessageChange}
              onResetMessage={handleResetEmailMessage}
              date={currentDateString}
              nursesSignature={nurseSignature}
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

