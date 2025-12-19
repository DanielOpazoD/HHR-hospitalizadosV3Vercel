import React, { Suspense } from 'react';
import type { ModuleType } from '../../components';
import type { UserRole } from '../../hooks/useAuthState';
import { canEditModule } from '../../utils/permissions';
import {
  AuditViewLazy,
  CensusViewLazy,
  CudyrViewLazy,
  HandoffViewLazy,
  MedicalSignatureViewLazy,
  ReportsViewLazy,
  WhatsAppIntegrationViewLazy
} from './lazyViews';
import { ViewLoader } from './ViewLoader';

interface ModuleRouterProps {
  currentModule: ModuleType;
  censusViewMode: 'REGISTER' | 'ANALYTICS';
  selectedDay: number;
  selectedMonth: number;
  currentDateString: string;
  showBedManager: boolean;
  onOpenBedManager: () => void;
  onCloseBedManager: () => void;
  role: UserRole | undefined;
  isSignatureMode: boolean;
}

export const ModuleRouter: React.FC<ModuleRouterProps> = ({
  currentModule,
  censusViewMode,
  selectedDay,
  selectedMonth,
  currentDateString,
  showBedManager,
  onOpenBedManager,
  onCloseBedManager,
  role,
  isSignatureMode
}) => {
  if (isSignatureMode) {
    return (
      <Suspense fallback={<ViewLoader />}>
        <MedicalSignatureViewLazy />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ViewLoader />}>
      {currentModule === 'CENSUS' && (
        <CensusViewLazy
          viewMode={censusViewMode}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          currentDateString={currentDateString}
          onOpenBedManager={onOpenBedManager}
          showBedManagerModal={showBedManager}
          onCloseBedManagerModal={onCloseBedManager}
          readOnly={!canEditModule(role, 'CENSUS')}
        />
      )}

      {currentModule === 'CUDYR' && <CudyrViewLazy readOnly={!canEditModule(role, 'CUDYR')} />}
      {currentModule === 'NURSING_HANDOFF' && <HandoffViewLazy type="nursing" readOnly={!canEditModule(role, 'NURSING_HANDOFF')} />}
      {currentModule === 'MEDICAL_HANDOFF' && <HandoffViewLazy type="medical" readOnly={!canEditModule(role, 'MEDICAL_HANDOFF')} />}
      {currentModule === 'REPORTS' && <ReportsViewLazy />}
      {currentModule === 'AUDIT' && <AuditViewLazy />}
      {currentModule === 'WHATSAPP' && <WhatsAppIntegrationViewLazy />}
    </Suspense>
  );
};
