import { CENSUS_DEFAULT_RECIPIENTS } from '../../constants/email';
import { buildCensusMasterBuffer } from '../../services/censusMasterExport';
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
    const requesterEmail = (event.headers['x-user-email'] || event.headers['X-User-Email']) as string | undefined;
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
        const { date, recipients, nursesSignature, body } = payload;

        if (!date) {
            return {
                statusCode: 400,
                body: 'Solicitud inválida: falta la fecha o los datos del censo.'
            };
        }

        const [yearStr, monthStr, dayStr] = date.split('-');
        const attachmentBuffer = await buildCensusMasterBuffer(
            Number(yearStr),
            Number(monthStr) - 1,
            Number(dayStr)
        );
        const attachmentName = `Censo_Maestro_${monthStr}_${yearStr}.xlsx`;
        const resolvedRecipients: string[] = Array.isArray(recipients) && recipients.length > 0
            ? recipients
            : CENSUS_DEFAULT_RECIPIENTS;

        const gmailResponse = await sendCensusEmail({
            date,
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
        return {
            statusCode: 500,
            body: message
        };
    }
};
