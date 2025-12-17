export type RuntimeEnv = Record<string, any>;

/**
 * Returns the environment variables object depending on the runtime.
 * - In Vite/browser, `import.meta.env` will be used.
 * - In Node/serverless, falls back to `process.env`.
 */
export const getRuntimeEnv = (): RuntimeEnv => {
    if (typeof import !== 'undefined' && (import.meta as any)?.env) {
        return (import.meta as any).env as RuntimeEnv;
    }

    if (typeof process !== 'undefined' && process.env) {
        return process.env as RuntimeEnv;
    }

    return {} as RuntimeEnv;
};

export const isDevEnvironment = (): boolean => {
    const env = getRuntimeEnv();
    return Boolean(env?.DEV ?? env?.NODE_ENV === 'development');
};
