/**
 * Shift Message Parser
 * Parses WhatsApp messages containing shift schedules from Hospital Hanga Roa
 * 
 * Handles various message formats:
 * - E.U Catalina Hidalgo: +56 9 6607 5214
 * - Tens anestesia y partos: María Ignacia Oliver +56 9 7668 0470
 * - Pediatra: Dr. Pulgar +56 9 9441 6731 hasta el martes...; luego Dr. Herrera +56 9...
 */

// Role abbreviation mappings
const ROLE_EXPANSIONS: Record<string, string> = {
    'E.U': 'Enfermera Universitaria',
    'EU': 'Enfermera Universitaria',
    'E.U.': 'Enfermera Universitaria',
    'TENS': 'Técnico en Enfermería',
    'Tens': 'Técnico en Enfermería',
    'TMT': 'Traumatólogo',
    'Gine': 'Ginecólogo'
};

export interface StaffMember {
    role: string;
    name: string;
    phone: string;
    whatsappUrl: string;
    notes?: string;
    replacement?: {
        name: string;
        phone: string;
        whatsappUrl: string;
        startDate: string;
    };
}

export interface ParsedShift {
    startDate: string;
    endDate: string;
    staff: StaffMember[];
    originalMessage: string;
    parsedAt: string;
    source: 'whatsapp';
}

/**
 * Parse date from DD/MM/YYYY to YYYY-MM-DD
 */
function parseDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Normalize phone number to +56XXXXXXXXX format
 */
function normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, '');
}

/**
 * Create WhatsApp deep link from phone number
 */
function createWhatsAppUrl(phone: string): string {
    const cleanPhone = normalizePhone(phone).replace('+', '');
    return `https://wa.me/${cleanPhone}`;
}

/**
 * Expand role abbreviations to full names
 */
function expandRole(role: string): string {
    const trimmed = role.trim();
    return ROLE_EXPANSIONS[trimmed] || trimmed;
}

/**
 * Parse a single staff line from the message
 * Handles multiple formats:
 * - "Role: Name: +56 9 XXXX XXXX"
 * - "Role Name: +56 9 XXXX XXXX"  
 * - "Role: Name +56 9 XXXX XXXX"
 * - With replacement: "... hasta el martes...; luego Dr. X +56 9..."
 */
function parseStaffLine(line: string): StaffMember | null {
    // Clean the line
    const cleanLine = line.replace(/^[-•]\s*/, '').trim();

    if (!cleanLine) return null;

    // Phone number pattern
    const phonePattern = /\+56\s*9\s*[\d\s]+/g;
    const phones = cleanLine.match(phonePattern);

    if (!phones || phones.length === 0) return null;

    // Check for replacement pattern ("hasta...luego" or "hasta...; luego")
    const hasReplacement = /hasta\s+(?:el\s+)?\w+.*?(?:;?\s*luego|,\s*luego)/i.test(cleanLine);

    let staff: StaffMember | null = null;

    if (hasReplacement && phones.length >= 2) {
        // Split by "luego" to get primary and replacement
        const parts = cleanLine.split(/;?\s*luego\s*/i);

        if (parts.length >= 2) {
            const primaryPart = parts[0];
            const replacementPart = parts[1];

            // Parse primary staff
            const primaryPhone = phones[0];
            const replacementPhone = phones[1];

            // Extract notes (everything after phone until "luego")
            const notesMatch = primaryPart.match(new RegExp(
                normalizePhone(primaryPhone).replace(/\+/g, '\\+') +
                '\\s*(.+?)$'
            ));
            const notes = notesMatch ? notesMatch[1].trim() : undefined;

            // Parse role and name from primary part
            const { role, name } = parseRoleAndName(primaryPart, primaryPhone);

            // Parse replacement name
            const replacementName = extractNameFromPart(replacementPart, replacementPhone);

            staff = {
                role: expandRole(role),
                name,
                phone: normalizePhone(primaryPhone),
                whatsappUrl: createWhatsAppUrl(primaryPhone),
                notes: notes || undefined,
                replacement: {
                    name: replacementName,
                    phone: normalizePhone(replacementPhone),
                    whatsappUrl: createWhatsAppUrl(replacementPhone),
                    startDate: '' // Will be extracted from notes if needed
                }
            };
        }
    } else {
        // Simple case: just one staff member
        const phone = phones[0];
        const { role, name } = parseRoleAndName(cleanLine, phone);

        if (role && name) {
            staff = {
                role: expandRole(role),
                name,
                phone: normalizePhone(phone),
                whatsappUrl: createWhatsAppUrl(phone)
            };
        }
    }

    return staff;
}

/**
 * Parse role and name from a line segment
 */
function parseRoleAndName(text: string, phone: string): { role: string; name: string } {
    // Remove phone and everything after from text for parsing
    const phoneEscaped = phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    const beforePhone = text.split(new RegExp(phoneEscaped))[0].trim();

    // Try different patterns

    // Pattern 1: "Role: Name" (with colon separating role and name)
    const colonMatch = beforePhone.match(/^(.+?):\s*(.+)$/);
    if (colonMatch) {
        const potentialRole = colonMatch[1].trim();
        const potentialName = colonMatch[2].trim();

        // Check if there's another colon (Role: Name: phone was already handled)
        if (!potentialName.includes(':')) {
            return { role: potentialRole, name: potentialName };
        }

        // Pattern: "Role: SubRole: Name" - combine first two as role
        const secondColonMatch = potentialName.match(/^(.+?):\s*(.+)$/);
        if (secondColonMatch) {
            return {
                role: `${potentialRole} ${secondColonMatch[1]}`.trim(),
                name: secondColonMatch[2].trim()
            };
        }
    }

    // Pattern 2: "Role Name" (role is first word(s) before Dr./Dra. or recognizable name pattern)
    const drMatch = beforePhone.match(/^(.+?)\s+((?:Dr\.?|Dra\.?)\s*.+)$/i);
    if (drMatch) {
        return { role: drMatch[1].trim(), name: drMatch[2].trim() };
    }

    // Pattern 3: Just take everything before phone as name, use generic role
    return { role: 'Personal', name: beforePhone };
}

/**
 * Extract name from a replacement part
 */
function extractNameFromPart(part: string, phone: string): string {
    const phoneEscaped = phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    const beforePhone = part.split(new RegExp(phoneEscaped))[0].trim();
    return beforePhone || 'Sin nombre';
}

/**
 * Main function: Parse a WhatsApp shift message
 */
export function parseShiftMessage(message: string): ParsedShift | null {
    // Check if message contains shift info keywords
    const lowerMessage = message.toLowerCase();
    if (!lowerMessage.includes('turno pabellon') &&
        !lowerMessage.includes('turno pabellón') &&
        !lowerMessage.includes('envío turno') &&
        !lowerMessage.includes('envio turno')) {
        return null;
    }

    try {
        // Extract dates - try multiple patterns
        let startDate = '';
        let endDate = '';

        // Pattern 1: "del DD/MM/YYYY hasta el DD/MM/YYYY"
        const dateMatch1 = message.match(/del\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+hasta\s+el\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (dateMatch1) {
            startDate = parseDate(dateMatch1[1]);
            endDate = parseDate(dateMatch1[2]);
        }

        // Pattern 2: "DD/MM/YYYY - DD/MM/YYYY" or "DD/MM/YYYY al DD/MM/YYYY"
        if (!startDate) {
            const dateMatch2 = message.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–al]+\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
            if (dateMatch2) {
                startDate = parseDate(dateMatch2[1]);
                endDate = parseDate(dateMatch2[2]);
            }
        }

        // If no dates found, we can't parse this as a valid shift
        if (!startDate || !endDate) {
            console.log('No se encontraron fechas en el mensaje');
            return null;
        }

        // Extract staff lines (start with - or •)
        const staffLines = message
            .split('\n')
            .filter(line => line.trim().match(/^[-•]/));

        const staff = staffLines
            .map(parseStaffLine)
            .filter((s): s is StaffMember => s !== null);

        // Create the parsed shift - even with no staff parsed, we save the original
        return {
            startDate,
            endDate,
            staff,
            originalMessage: message,
            parsedAt: new Date().toISOString(),
            source: 'whatsapp'
        };
    } catch (error) {
        console.error('Error parsing shift:', error);
        return null;
    }
}
