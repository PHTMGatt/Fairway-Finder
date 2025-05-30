import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // ✅ Auto-open browser locally
    proxy: {
      '/graphql': {
        target: 'http://localhost:3001', // 🔁 Backend API
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001', // 🔁 REST routes
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist', // ✅ Required for Render static deploy
    sourcemap: false, // 🔒 Remove for faster build unless debugging
  },
});
