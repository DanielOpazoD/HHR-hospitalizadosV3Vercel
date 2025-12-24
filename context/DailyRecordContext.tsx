
import React, { createContext, useContext } from 'react';
import { DailyRecordContextType } from '../hooks/useDailyRecord';

const DailyRecordContext = createContext<DailyRecordContextType | undefined>(undefined);

export const DailyRecordProvider: React.FC<{ value: DailyRecordContextType; children: React.ReactNode }> = ({ value, children }) => {
  return (
    <DailyRecordContext.Provider value={value}>
      {children}
    </DailyRecordContext.Provider>
  );
};

export const useDailyRecordContext = () => {
  const context = useContext(DailyRecordContext);
  if (!context) {
    throw new Error('useDailyRecordContext must be used within a DailyRecordProvider');
  }
  return context;
};