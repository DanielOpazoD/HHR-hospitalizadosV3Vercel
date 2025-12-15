/**
 * Message Sender Service
 * Formats and sends handoff notifications to WhatsApp
 */

export interface HandoffData {
    date: string;
    signedBy: string;
    signedAt: string;
    summary: {
        hospitalized: number;
        newAdmissions: number;
        discharges: number;
    };
    publicUrl: string;
}

export function sendHandoffNotification(
    handoff: HandoffData,
    method: 'manual' | 'auto'
): string {
    const message = `
🏥 Hospital Hanga Roa
📋 Entrega de Turno Médico

📅 Fecha: ${formatDate(handoff.date)}
👨‍⚕️ Entregado por: ${handoff.signedBy}
🕐 Firmado: ${handoff.signedAt}
${method === 'manual' ? '📤 Enviado manualmente' : '🤖 Envío automático'}

📊 Resumen:
• Hospitalizados: ${handoff.summary.hospitalized} pacientes
• Nuevos ingresos: ${handoff.summary.newAdmissions}
• Altas: ${handoff.summary.discharges}

🔗 Ver entrega completa:
${handoff.publicUrl}

- Enviado automáticamente por Sistema HHR
  `.trim();

    return message;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}
