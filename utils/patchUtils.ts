/**
 * Patch Utilities
 * Utilities for applying partial updates with dot-notation paths.
 */

/**
 * Applies dot-notation updates to an object.
 * Useful for mirroring Firestore updateDoc behavior locally.
 * 
 * Example:
 * applyPatches(record, { "beds.bed-1.patientName": "Juan" })
 * // returns new record with updated name
 */
export const applyPatches = <T>(obj: T, patches: Record<string, any>): T => {
    if (!obj) return obj;

    // Deep clone state to avoid mutation side-effects
    const newObj = JSON.parse(JSON.stringify(obj));

    Object.entries(patches).forEach(([path, value]) => {
        const parts = path.split('.');
        let current: any = newObj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            // Create structure if missing (auto-vivification)
            if (current[part] === undefined || current[part] === null) {
                current[part] = {};
            }
            current = current[part];
        }

        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;
    });

    return newObj;
};
