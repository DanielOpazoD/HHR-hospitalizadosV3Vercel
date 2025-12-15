/**
 * Centralized Error Logging Service
 * Handles error tracking, logging, and reporting
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorLog {
    id: string;
    timestamp: string;
    message: string;
    severity: ErrorSeverity;
    stack?: string;
    userId?: string;
    userEmail?: string;
    context?: Record<string, any>;
    userAgent?: string;
    url?: string;
}

class ErrorService {
    private static instance: ErrorService;
    private errors: ErrorLog[] = [];
    private maxLocalErrors = 100; // Keep last 100 errors locally

    private constructor() {
        // Set up global error handlers
        this.setupGlobalHandlers();
    }

    static getInstance(): ErrorService {
        if (!ErrorService.instance) {
            ErrorService.instance = new ErrorService();
        }
        return ErrorService.instance;
    }

    private setupGlobalHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                message: `Unhandled Promise Rejection: ${event.reason}`,
                severity: 'high',
                stack: event.reason?.stack,
                context: {
                    type: 'unhandledrejection',
                    reason: event.reason,
                },
            });
        });

        // Handle global errors
        window.addEventListener('error', (event) => {
            this.logError({
                message: event.message || 'Unknown error',
                severity: 'high',
                stack: event.error?.stack,
                context: {
                    type: 'error',
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                },
            });
        });
    }

    /**
     * Log an error with context
     */
    logError(params: {
        message: string;
        severity?: ErrorSeverity;
        error?: Error;
        stack?: string;
        context?: Record<string, any>;
        userId?: string;
        userEmail?: string;
    }): void {
        const errorLog: ErrorLog = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            message: params.message,
            severity: params.severity || 'medium',
            stack: params.stack || params.error?.stack,
            userId: params.userId,
            userEmail: params.userEmail,
            context: params.context,
            userAgent: navigator.userAgent,
            url: window.location.href,
        };

        // Store locally
        this.errors.push(errorLog);
        if (this.errors.length > this.maxLocalErrors) {
            this.errors.shift(); // Remove oldest
        }

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('[ErrorService]', errorLog);
        }

        // Send to external service (Sentry, LogRocket, etc.) - Future
        this.sendToExternalService(errorLog);

        // Store critical errors in localStorage for offline review
        if (errorLog.severity === 'critical' || errorLog.severity === 'high') {
            this.persistCriticalError(errorLog);
        }
    }

    /**
     * Log Firebase error with better context
     */
    logFirebaseError(error: any, operation: string, context?: Record<string, any>): void {
        const firebaseErrorCode = error?.code || 'unknown';
        const message = `Firebase ${operation} failed: ${firebaseErrorCode}`;

        this.logError({
            message,
            severity: this.getFirebaseErrorSeverity(firebaseErrorCode),
            error,
            context: {
                operation,
                firebaseCode: firebaseErrorCode,
                ...context,
            },
        });
    }

    /**
     * Log validation error
     */
    logValidationError(fieldName: string, error: any, context?: Record<string, any>): void {
        this.logError({
            message: `Validation failed for ${fieldName}`,
            severity: 'low',
            error,
            context: {
                fieldName,
                validationError: error,
                ...context,
            },
        });
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error: any): string {
        // Firebase auth errors
        if (error?.code?.startsWith('auth/')) {
            return this.getFirebaseAuthMessage(error.code);
        }

        // Firebase Firestore errors
        if (error?.code?.startsWith('permission-denied')) {
            return 'No tiene permisos para realizar esta acción';
        }

        if (error?.code === 'unavailable') {
            return 'Servicio temporalmente no disponible. Por favor, intente más tarde.';
        }

        // Network errors
        if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
            return 'Error de conexión. Verifique su conexión a internet.';
        }

        // Validation errors
        if (error?.name === 'ZodError') {
            return 'Los datos ingresados no son válidos. Por favor, revise los campos.';
        }

        // Default
        return 'Ha ocurrido un error. Por favor, intente nuevamente.';
    }

    /**
     * Get all errors (for admin debugging)
     */
    getAllErrors(): ErrorLog[] {
        return [...this.errors];
    }

    /**
     * Clear all errors
     */
    clearErrors(): void {
        this.errors = [];
        localStorage.removeItem('criticalErrors');
    }

    // ============================================
    // PRIVATE METHODS
    // ============================================

    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getFirebaseErrorSeverity(code: string): ErrorSeverity {
        if (code.includes('permission-denied')) return 'high';
        if (code.includes('not-found')) return 'medium';
        if (code.includes('unavailable')) return 'critical';
        if (code.includes('unauthenticated')) return 'medium';
        return 'medium';
    }

    private getFirebaseAuthMessage(code: string): string {
        const messages: Record<string, string> = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuario deshabilitado',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/email-already-in-use': 'Email ya está en uso',
            'auth/weak-password': 'Contraseña muy débil',
            'auth/network-request-failed': 'Error de red. Verifique su conexión.',
            'auth/too-many-requests': 'Demasiados intentos. Intente más tarde.',
        };

        return messages[code] || 'Error de autenticación';
    }

    private persistCriticalError(error: ErrorLog): void {
        try {
            const existing = localStorage.getItem('criticalErrors');
            const errors = existing ? JSON.parse(existing) : [];
            errors.push(error);

            // Keep only last 20 critical errors
            if (errors.length > 20) {
                errors.shift();
            }

            localStorage.setItem('criticalErrors', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to persist critical error', e);
        }
    }

    private sendToExternalService(error: ErrorLog): void {
        // TODO: Integrate with Sentry, LogRocket, or similar service
        // Example with Sentry:
        // if (window.Sentry) {
        //   window.Sentry.captureException(error.message, {
        //     level: error.severity,
        //     extra: error.context,
        //   });
        // }
    }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();

// Export helper function for easy access
export const logError = (
    message: string,
    error?: Error,
    context?: Record<string, any>
) => {
    errorService.logError({ message, error, context });
};

export const logFirebaseError = (
    error: any,
    operation: string,
    context?: Record<string, any>
) => {
    errorService.logFirebaseError(error, operation, context);
};

export const getUserFriendlyErrorMessage = (error: any): string => {
    return errorService.getUserFriendlyMessage(error);
};
