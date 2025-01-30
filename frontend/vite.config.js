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
      '/api': {
        target: 'http://backend:5000',  // Correcto, usa el nombre del servicio
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/health': {
        target: 'http://backend:5000',  // También actualizamos el health check
        changeOrigin: true,
        secure: false // Permite conexiones no seguras en desarrollo
      }
    }
  },
  build: {
    rollupOptions: {
      input: '/src/main.jsx'  // Especificar el entry point
    }
  }
}) 