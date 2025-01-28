import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Importante para Docker
    port: 5173,
    watch: {
      usePolling: true  // Importante para Docker en Windows/Mac
    },
    proxy: {
      '/health': {
        target: 'http://backend:5000',  // Actualizado al puerto 5000
        changeOrigin: true
      },
      '/api': {
        target: 'http://backend:5000',  // Actualizado al puerto 5000
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: '/src/main.jsx'  // Especificar el entry point
    }
  }
}) 