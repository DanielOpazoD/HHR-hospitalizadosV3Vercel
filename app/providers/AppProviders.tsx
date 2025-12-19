import React from 'react';
import { DailyRecordProvider, RoleProvider, StaffProvider } from '../../context';
import type { DailyRecordContextType } from '../../hooks';
import type { UserRole } from '../../hooks/useAuthState';

interface AppProvidersProps {
  dailyRecord: DailyRecordContextType;
  roleContext: {
    role: UserRole | undefined;
    canEdit: boolean;
    isEditor: boolean;
    isViewer: boolean;
  };
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ dailyRecord, roleContext, children }) => (
  <RoleProvider
    role={roleContext.role}
    canEdit={roleContext.canEdit}
    isEditor={roleContext.isEditor}
    isViewer={roleContext.isViewer}
  >
    <DailyRecordProvider value={dailyRecord}>
      <StaffProvider>
        {children}
      </StaffProvider>
    </DailyRecordProvider>
  </RoleProvider>
);
