import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('recharts')) return 'vendor-viz';
              if (id.includes('motion')) return 'vendor-motion';
              
              // Vendor chung cho các thư viện khác trong node_modules
              return 'vendor-core';
            }
          }
        },
      },
    },
  };
});
