import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      hmr: false,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.split(path.sep).join('/');
            if (!normalizedId.includes('node_modules')) return;

            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/react-is/') ||
              normalizedId.includes('/node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }

            if (normalizedId.includes('/node_modules/@supabase/')) {
              return 'supabase-vendor';
            }

            if (
              normalizedId.includes('/node_modules/recharts/') ||
              normalizedId.includes('/node_modules/d3-')
            ) {
              return 'charts-vendor';
            }

            if (normalizedId.includes('/node_modules/lucide-react/')) {
              return 'icons-vendor';
            }

            if (
              normalizedId.includes('/node_modules/sonner/') ||
              normalizedId.includes('/node_modules/motion/') ||
              normalizedId.includes('/node_modules/qrcode.react/') ||
              normalizedId.includes('/node_modules/clsx/') ||
              normalizedId.includes('/node_modules/tailwind-merge/') ||
              normalizedId.includes('/node_modules/date-fns/')
            ) {
              return 'ui-vendor';
            }
          },
        },
      },
    },
  };
});
