import { DailyRecord } from '../../types';
import { CENSUS_DEFAULT_RECIPIENTS } from '../../constants/email';

interface TriggerEmailParams {
    date: string;
    records: DailyRecord[];
    recipients?: string[];
    nursesSignature?: string;
    body?: string;
    userEmail?: string | null;
    userRole?: string | null;
}

const ENDPOINT = '/.netlify/functions/send-census-email';

export const triggerCensusEmail = async (params: TriggerEmailParams) => {
    const { date, records, recipients, nursesSignature, body, userEmail, userRole } = params;

    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail || '',
            'x-user-role': userRole || ''
        },
        body: JSON.stringify({
            date,
            records,
            recipients: recipients && recipients.length > 0 ? recipients : CENSUS_DEFAULT_RECIPIENTS,
            nursesSignature,
            body
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo enviar el correo.');
    }

    return response.json();
};
