import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Default fallback component for error boundaries
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Algo salió mal
                </h2>

                <p className="text-gray-600 mb-4">
                    Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                </p>

                <details className="text-left bg-gray-50 rounded-lg p-3 mb-4">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                        Detalles del error
                    </summary>
                    <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-32">
                        {error.message}
                    </pre>
                </details>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={resetErrorBoundary}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Recargar página
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

/**
 * Error Boundary Component
 * Wrapper around react-error-boundary with custom styling.
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
    const handleError = (error: Error, info: React.ErrorInfo) => {
        console.error('ErrorBoundary caught an error:', error, info);
        onError?.(error, info);
    };

    if (fallback) {
        return (
            <ReactErrorBoundary
                fallback={fallback as React.ReactElement}
                onError={handleError}
            >
                {children}
            </ReactErrorBoundary>
        );
    }

    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleError}
        >
            {children}
        </ReactErrorBoundary>
    );
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: React.ReactNode
): React.FC<P> {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const WithErrorBoundaryWrapper: React.FC<P> = (props) => (
        <ErrorBoundary fallback={fallback}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    WithErrorBoundaryWrapper.displayName = `withErrorBoundary(${displayName})`;

    return WithErrorBoundaryWrapper;
}

// Re-export useful types from react-error-boundary
export type { FallbackProps } from 'react-error-boundary';
