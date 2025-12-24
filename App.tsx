import React, { useState, Suspense } from 'react';
import { useDailyRecord, useAuthState, useDateNavigation, useFileOperations, useExistingDays, useCensusEmail, useSignatureMode } from '@/hooks';
import { useStorageMigration } from '@/hooks/useStorageMigration';
import { DailyRecordProvider, StaffProvider } from '@/context';
import { Navbar, DateStrip, SettingsModal, TestAgent, SyncWatcher, DemoModePanel, LoginPage, ErrorBoundary } from '@/components';
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary';
import { ViewLoader } from '@/components/ui/ViewLoader';
import type { ModuleType } from '@/components';
import { canEditModule } from '@/utils/permissions';
import { generateCensusMasterExcel } from '@/services';
import { CensusEmailConfigModal } from '@/components/census/CensusEmailConfigModal';

// Lazy-loaded views
import {
  CensusView,
  CudyrView,
  HandoffView,
  ReportsView,
  AuditView,
  MedicalSignatureView,
  WhatsAppIntegrationView
} from './views/LazyViews';

function App() {
  // ========== STORAGE MIGRATION (runs once on startup) ==========
  useStorageMigration();

  // ========== AUTH STATE ==========
  const { user, authLoading, isFirebaseConnected, handleLogout, role, canEdit, isEditor, isViewer } = useAuthState();

  // ========== DATE NAVIGATION ==========
  const {
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedDay, setSelectedDay,
    daysInMonth,
    currentDateString: navDateString
  } = useDateNavigation();

  // ========== SIGNATURE MODE ==========
  const { isSignatureMode, currentDateString } = useSignatureMode(navDateString, user, authLoading);

  // ========== DAILY RECORD HOOK ==========
  const dailyRecordHook = useDailyRecord(currentDateString);
  const { record, refresh, syncStatus, lastSyncTime } = dailyRecordHook;

  // Calculate existing days
  const existingDaysInMonth = useExistingDays(selectedYear, selectedMonth, record);

  // Nurse signature for email (night shift nurses names only)
  const nurseSignature = React.useMemo(() => {
    if (!record) return '';
    const nightShift = record.nursesNightShift?.filter(n => n && n.trim()) || [];
    if (nightShift.length > 0) {
      return nightShift.join(' / ');
    }
    // Fallback to legacy nurses array
    return (record.nurses?.filter(n => n && n.trim()) || []).join(' / ');
  }, [record]);

  // ========== CENSUS EMAIL ==========
  const censusEmail = useCensusEmail({
    record,
    currentDateString,
    nurseSignature,
    selectedYear,
    selectedMonth,
    selectedDay,
    user,
    role,
  });

  // ========== FILE OPERATIONS ==========
  const { handleExportJSON, handleExportCSV, handleImportJSON } = useFileOperations(record, refresh);

  // ========== UI STATE ==========
  const [currentModule, setCurrentModule] = useState<ModuleType>('CENSUS');
  const [censusViewMode, setCensusViewMode] = useState<'REGISTER' | 'ANALYTICS'>('REGISTER');
  const [showSettings, setShowSettings] = useState(false);
  const [isTestAgentRunning, setIsTestAgentRunning] = useState(false);
  const [showBedManager, setShowBedManager] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

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

  // ========== MAIN RENDER ==========
  return (
    <DailyRecordProvider value={dailyRecordHook}>
      <StaffProvider>
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
              onOpenBedManager={currentModule === 'CENSUS' ? () => setShowBedManager(true) : undefined}
              onExportExcel={currentModule === 'CENSUS'
                ? () => generateCensusMasterExcel(selectedYear, selectedMonth, selectedDay)
                : undefined}
              onConfigureEmail={currentModule === 'CENSUS' ? () => censusEmail.setShowEmailConfig(true) : undefined}
              onSendEmail={currentModule === 'CENSUS' ? censusEmail.sendEmail : undefined}
              emailStatus={censusEmail.status}
              emailErrorMessage={censusEmail.error}
              syncStatus={syncStatus}
              lastSyncTime={lastSyncTime}
            />
          )}

          {/* Main Content Area */}
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
            isOpen={censusEmail.showEmailConfig}
            onClose={() => censusEmail.setShowEmailConfig(false)}
            recipients={censusEmail.recipients}
            onRecipientsChange={censusEmail.setRecipients}
            message={censusEmail.message}
            onMessageChange={censusEmail.onMessageChange}
            onResetMessage={censusEmail.onResetMessage}
            date={currentDateString}
            nursesSignature={nurseSignature}
            isAdminUser={censusEmail.isAdminUser}
            testModeEnabled={censusEmail.testModeEnabled}
            onTestModeChange={censusEmail.setTestModeEnabled}
            testRecipient={censusEmail.testRecipient}
            onTestRecipientChange={censusEmail.setTestRecipient}
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
  );
}

// Wrap entire app with Global Error Boundary
const AppWithErrorBoundary = () => (
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

export default AppWithErrorBoundary;
