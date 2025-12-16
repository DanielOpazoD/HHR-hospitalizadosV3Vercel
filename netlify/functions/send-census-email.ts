import { CENSUS_DEFAULT_RECIPIENTS } from '../../constants/email';
import { buildCensusDailyRawBuffer } from '../../services/exporters/censusRawWorkbook';
import { sendCensusEmail } from '../../services/email/gmailClient';

const ALLOWED_ROLES = ['nurse_hospital', 'admin'];

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Método no permitido'
        };
    }

    const requesterRole = (event.headers['x-user-role'] || event.headers['X-User-Role']) as string | undefined;
    if (!requesterRole || !ALLOWED_ROLES.includes(requesterRole)) {
        return {
            statusCode: 403,
            body: 'No autorizado para enviar correos de censo.'
        };
    }

    if (!event.body) {
        return {
            statusCode: 400,
            body: 'Solicitud inválida: falta el cuerpo.'
        };
    }

    try {
        const payload = JSON.parse(event.body);
        const { date, record, recipients, nursesSignature } = payload;

        if (!date || !record) {
            return {
                statusCode: 400,
                body: 'Solicitud inválida: falta la fecha o los datos del censo.'
            };
        }

        const attachmentBuffer = await buildCensusDailyRawBuffer(record);
        const attachmentName = `Censo_HangaRoa_${date}.xlsx`;
        const resolvedRecipients: string[] = Array.isArray(recipients) && recipients.length > 0
            ? recipients
            : CENSUS_DEFAULT_RECIPIENTS;

        const gmailResponse = await sendCensusEmail({
            date,
            recipients: resolvedRecipients,
            attachmentBuffer,
            attachmentName,
            nursesSignature
        });

        console.log('Gmail send response', gmailResponse);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Correo enviado', gmailId: gmailResponse.id })
        };
    } catch (error: any) {
        console.error('Error enviando correo de censo', error);
        const message = error?.message || 'Error desconocido enviando el correo.';
        return {
            statusCode: 500,
            body: message
        };
    }
};
