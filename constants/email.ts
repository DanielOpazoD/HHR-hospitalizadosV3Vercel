import { formatDateDDMMYYYY } from '../services/utils/dateFormatter';

export const CENSUS_DEFAULT_RECIPIENTS = [
    'hospitalizados@hospitalhangaroa.cl'
];

export const buildCensusEmailSubject = (date: string) => `Censo diario hospitalizados - ${formatDateDDMMYYYY(date)}`;

export const buildCensusEmailBody = (date: string, nursesSignature?: string) => {
    const shortDate = formatDateDDMMYYYY(date);
    const formattedDate = (() => {
        const [year, month, day] = (date || '').split('-').map(Number);
        if (!year || !month || !day) return shortDate;

        const parsedDate = new Date(year, month - 1, day);
        if (Number.isNaN(parsedDate.getTime())) return shortDate;

        return parsedDate.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    })();

    const signatureBlock = nursesSignature
        ? [
            nursesSignature,
            'Enfermería - Servicio de Hospitalizados',
            'Hospital Hanga Roa'
        ]
        : [];

    return [
        'Estimados/as:',
        '',
        `Junto con saludar, adjunto el censo diario de pacientes hospitalizados correspondiente al ${formattedDate}.`,
        '',
        ...signatureBlock
    ].join('\n');
};
