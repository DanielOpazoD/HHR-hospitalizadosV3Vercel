import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
    ],
    define: {
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY), // Use env.API_KEY if available, otherwise fallback to GEMINI_API_KEY
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks (larger libraries)
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'vendor-ui': ['lucide-react', 'recharts'],
            // Feature chunks (lazy loaded)
            'reports': ['exceljs', 'file-saver'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // 1MB warning threshold
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // Remove console.logs in production
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './tests/setup.ts',
    }
  };
});
