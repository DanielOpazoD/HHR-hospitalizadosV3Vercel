import React, { useState } from 'react';
import { useDailyRecord, useAuthState, useDateNavigation, useFileOperations, useExistingDays } from './hooks';
import { useStorageMigration } from './hooks/useStorageMigration';
import { AppProviders } from './app/providers/AppProviders';
import { ModuleRouter } from './app/router/ModuleRouter';
import { useCensusEmail } from './app/email/useCensusEmail';
import { Navbar, DateStrip, SettingsModal, TestAgent, SyncWatcher, DemoModePanel, LoginPage, ErrorBoundary } from './components';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import type { ModuleType } from './components';
import { generateCensusMasterExcel } from './services';
import { CensusEmailConfigModal } from './components/CensusEmailConfigModal';

// ========== AUTH IMPORTS ==========
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebaseConfig';

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
      return `Enfermería turno noche – ${nightShift.join(' / ')}`;
    }
    const nurses = record.nurses?.filter(n => n && n.trim()) || [];
    return nurses.join(' / ');
  }, [record]);

  // ========== FILE OPERATIONS (extracted to hook) ==========
  const { handleExportJSON, handleExportCSV, handleImportJSON } = useFileOperations(record, refresh);

  // ========== UI STATE ==========
  const [currentModule, setCurrentModule] = useState<ModuleType>('CENSUS');
  const [censusViewMode, setCensusViewMode] = useState<'REGISTER' | 'ANALYTICS'>('REGISTER');
  const [showSettings, setShowSettings] = useState(false);
  const [isTestAgentRunning, setIsTestAgentRunning] = useState(false);
  const [showBedManager, setShowBedManager] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  const {
    recipients: emailRecipients,
    setRecipients: setEmailRecipients,
    message: emailMessage,
    status: emailStatus,
    error: emailError,
    handleMessageChange: handleEmailMessageChange,
    resetMessage: handleResetEmailMessage,
    sendEmail: handleSendCensusEmail
  } = useCensusEmail({
    currentDateString,
    nurseSignature,
    record: record ?? null,
    selectedYear,
    selectedMonth,
    selectedDay,
    user,
    role
  });

  const showPrintButton = currentModule === 'CUDYR' || currentModule === 'NURSING_HANDOFF' || currentModule === 'MEDICAL_HANDOFF';

  // ========== LOADING STATE ==========
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-medical-600 text-xl font-bold">Cargando...</div>
      </div>
    );
  }

  // ========== AUTH REQUIRED ==========
  if (!user && !isSignatureMode) {
    return <LoginPage onLoginSuccess={() => { }} />;
  }

  const roleContext = { role, canEdit, isEditor, isViewer };

  // ========== MAIN RENDER ==========
  return (
    <AppProviders dailyRecord={dailyRecordHook} roleContext={roleContext}>
      <div className="min-h-screen bg-slate-100 font-sans flex flex-col print:bg-white print:p-0">
        {!isSignatureMode && (
          <Navbar
            currentModule={currentModule}
            setModule={setCurrentModule}
            censusViewMode={censusViewMode}
            setCensusViewMode={setCensusViewMode}
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
            onPrintPDF={showPrintButton ? () => window.print() : undefined}
            onOpenBedManager={() => setShowBedManager(true)}
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
            <ModuleRouter
              currentModule={currentModule}
              censusViewMode={censusViewMode}
              selectedDay={selectedDay}
              selectedMonth={selectedMonth}
              currentDateString={currentDateString}
              showBedManager={showBedManager}
              onOpenBedManager={() => setShowBedManager(true)}
              onCloseBedManager={() => setShowBedManager(false)}
              role={role}
              isSignatureMode={isSignatureMode}
            />
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
    </AppProviders>
  );
}

// Wrap entire app with Global Error Boundary
const AppWithErrorBoundary = () => (
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

export default AppWithErrorBoundary;
