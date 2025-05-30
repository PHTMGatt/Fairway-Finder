import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // opens browser when you run `vite` locally
    proxy: {
      '/graphql': {
        target: 'http://localhost:3001', // Express + Apollo
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001', // Express REST
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
