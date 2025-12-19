import React from 'react';
import type { User } from 'firebase/auth';
import { buildCensusEmailBody, CENSUS_DEFAULT_RECIPIENTS } from '../../constants/email';
import { formatDate, getMonthRecordsFromFirestore, triggerCensusEmail } from '../../services';
import type { DailyRecord } from '../../types';
import type { UserRole } from '../../hooks/useAuthState';

export type EmailStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseCensusEmailParams {
  currentDateString: string;
  nurseSignature: string;
  record: DailyRecord | null;
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  user: User | null;
  role: UserRole | undefined;
}

const getStoredRecipients = () => {
  if (typeof window === 'undefined') return CENSUS_DEFAULT_RECIPIENTS;
  const stored = window.localStorage.getItem('censusEmailRecipients');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
    } catch (_) {
      // ignore parsing errors and fallback to defaults
    }
  }
  return CENSUS_DEFAULT_RECIPIENTS;
};

const getStoredMessage = (currentDateString: string, nurseSignature: string) => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('censusEmailMessage');
    if (stored) return stored;
  }
  return buildCensusEmailBody(currentDateString, nurseSignature);
};

export const useCensusEmail = ({
  currentDateString,
  nurseSignature,
  record,
  selectedYear,
  selectedMonth,
  selectedDay,
  user,
  role
}: UseCensusEmailParams) => {
  const [recipients, setRecipients] = React.useState<string[]>(() => getStoredRecipients());
  const [message, setMessage] = React.useState<string>(() => getStoredMessage(currentDateString, nurseSignature));
  const [messageEdited, setMessageEdited] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(window.localStorage.getItem('censusEmailMessage'));
    }
    return false;
  });
  const [status, setStatus] = React.useState<EmailStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('censusEmailRecipients', JSON.stringify(recipients));
    }
  }, [recipients]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('censusEmailMessage', message);
    }
  }, [message]);

  React.useEffect(() => {
    if (!messageEdited) {
      setMessage(buildCensusEmailBody(currentDateString, nurseSignature));
    }
  }, [currentDateString, nurseSignature, messageEdited]);

  const handleMessageChange = (value: string) => {
    setMessage(value);
    setMessageEdited(true);
  };

  const resetMessage = () => {
    setMessage(buildCensusEmailBody(currentDateString, nurseSignature));
    setMessageEdited(false);
  };

  const sendEmail = async () => {
    if (!record) {
      alert('No hay datos del censo para enviar.');
      return;
    }

    if (status === 'loading') return;

    const recipientList = (recipients || []).map(r => r.trim()).filter(Boolean);
    const resolvedRecipients = recipientList.length > 0 ? recipientList : CENSUS_DEFAULT_RECIPIENTS;
    const confirmationText = [
      `Enviar correo de censo del ${formatDate(currentDateString)}?`,
      `Destinatarios: ${resolvedRecipients.join(', ')}`,
      '',
      '¿Confirmas el envío?'
    ].join('\n');

    const confirmed = window.confirm(confirmationText);
    if (!confirmed) return;

    setError(null);
    setStatus('loading');

    try {
      const finalMessage = message?.trim() ? message : buildCensusEmailBody(currentDateString, nurseSignature);
      const monthRecords = await getMonthRecordsFromFirestore(selectedYear, selectedMonth);
      const limitDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

      const filteredRecords = monthRecords
        .filter(r => r.date <= limitDate)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (!filteredRecords.some(r => r.date === currentDateString) && record) {
        filteredRecords.push(record);
      }

      if (filteredRecords.length === 0) {
        throw new Error('No hay registros del mes para generar el Excel maestro.');
      }

      filteredRecords.sort((a, b) => a.date.localeCompare(b.date));
      await triggerCensusEmail({
        date: currentDateString,
        records: filteredRecords,
        recipients: resolvedRecipients,
        nursesSignature: nurseSignature || undefined,
        body: finalMessage,
        userEmail: user?.email,
        userRole: (user as any)?.role || role
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error enviando correo de censo', err);
      const messageText = err?.message || 'No se pudo enviar el correo.';
      setError(messageText);
      setStatus('error');
      alert(messageText);
    }
  };

  return {
    recipients,
    setRecipients,
    message,
    status,
    error,
    handleMessageChange,
    resetMessage,
    sendEmail
  };
};
