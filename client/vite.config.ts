import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// FF_API_TARGET lets the dev client talk to another API (e.g. the live Render server) for UI work.
const apiTarget = process.env.FF_API_TARGET || 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // opens browser when you run `vite` locally
    proxy: {
      '/graphql': {
        target: apiTarget, // Express + Apollo
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: apiTarget, // Express REST
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
