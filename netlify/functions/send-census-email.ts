import { CENSUS_DEFAULT_RECIPIENTS } from '../../constants/email';
import { DailyRecord } from '../../types';
import { buildCensusDailyRawBuffer } from '../../services/exporters/censusRawWorkbook';
import { sendCensusEmail } from '../../services/email/gmailClient';

const ALLOWED_ROLES = ['nurse_hospital', 'admin'];

const parseJsonBody = (raw: string | null) => {
    if (!raw) {
        throw new Error('Solicitud inválida: falta el cuerpo.');
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error('Solicitud inválida: el cuerpo no es un JSON válido.');
    }
};

const validateRecord = (record: DailyRecord | undefined) => {
    if (!record) {
        throw new Error('Solicitud inválida: falta el registro de censo.');
    }

    if (!record.date) {
        throw new Error('Solicitud inválida: el registro no contiene la fecha.');
    }

    if (!record.beds || typeof record.beds !== 'object' || Object.keys(record.beds).length === 0) {
        throw new Error('Solicitud inválida: el registro no contiene camas ni pacientes.');
    }
};

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Método no permitido'
        };
    }

    const requesterRole = (event.headers['x-user-role'] || event.headers['X-User-Role']) as string | undefined;
    const requesterEmail = (event.headers['x-user-email'] || event.headers['X-User-Email']) as string | undefined;
    if (!requesterRole || !ALLOWED_ROLES.includes(requesterRole)) {
        return {
            statusCode: 403,
            body: 'No autorizado para enviar correos de censo.'
        };
    }

    try {
        const payload = parseJsonBody(event.body);
        const { date, record, recipients, nursesSignature, body } = payload as {
            date?: string;
            record?: DailyRecord;
            recipients?: string[];
            nursesSignature?: string;
            body?: string;
        };

        validateRecord(record);
        const censusDate = date || record?.date;

        const attachmentBuffer = await buildCensusDailyRawBuffer(record as DailyRecord);
        const attachmentName = `Censo_HangaRoa_${censusDate}.xlsx`;
        const resolvedRecipients: string[] = Array.isArray(recipients) && recipients.length > 0
            ? recipients
            : CENSUS_DEFAULT_RECIPIENTS;

        const gmailResponse = await sendCensusEmail({
            date: censusDate!,
            recipients: resolvedRecipients,
            attachmentBuffer,
            attachmentName,
            nursesSignature,
            body,
            requestedBy: requesterEmail
        });

        console.log('Gmail send response', gmailResponse);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Correo enviado', gmailId: gmailResponse.id })
        };
    } catch (error: any) {
        console.error('Error enviando correo de censo', error);
        const message = error?.message || 'Error desconocido enviando el correo.';
        const isClientError = message.startsWith('Solicitud inválida') || message.startsWith('No autorizado');

        return {
            statusCode: isClientError ? 400 : 500,
            body: message
        };
    }
};
