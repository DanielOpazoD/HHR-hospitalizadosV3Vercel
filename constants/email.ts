import { formatDateDDMMYYYY } from '../services/utils/dateFormatter';

export const CENSUS_DEFAULT_RECIPIENTS = [
    'hospitalizados@hospitalhangaroa.cl'
];

export const buildCensusEmailSubject = (date: string) => `Censo diario hospitalizados – ${formatDateDDMMYYYY(date)}`;

export const buildCensusEmailBody = (date: string, nursesSignature?: string) => {
    const formattedDate = formatDateDDMMYYYY(date);
    const signatureLine = nursesSignature
        ? `Enfermería turno noche - ${nursesSignature}.`
        : 'Enfermería turno noche - "nombre enfermera 1" / "nombre enfermera 2".';
    return [
        'Estimados/as,',
        `Se adjunta el censo diario de hospitalizados correspondiente al ${formattedDate}.`,
        'Sin otro particular, se despiden',
        '',
        signatureLine
    ].join('\n');
};
