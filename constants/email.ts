import { formatDateDDMMYYYY } from '../services/utils/dateFormatter';

export const CENSUS_DEFAULT_RECIPIENTS = [
    'hospitalizados@hospitalhangaroa.cl'
];

export const buildCensusEmailSubject = (date: string) => `Censo diario hospitalizados – ${formatDateDDMMYYYY(date)}`;

export const buildCensusEmailBody = (date: string, nursesSignature?: string) => {
    const formattedDate = formatDateDDMMYYYY(date);
    const signatureLine = nursesSignature ? `\n\nAtentamente,\n${nursesSignature}` : '';
    return [
        'Estimados/as,',
        `Se adjunta el censo diario de hospitalizados correspondiente al ${formattedDate}.`,
        'Este correo fue generado de manera automática para agilizar la entrega del turno noche.',
        signatureLine
    ].filter(Boolean).join('\n');
};
