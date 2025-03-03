import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
      host: 'localhost',
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      'date-fns',
      'react-router-dom',
      'notistack',
      'axios'
    ],
    force: true
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  preview: {
    port: 5173
  },
  define: {
    'process.env': {},
    'window.API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://api.present.attadia.com'),
    'window.GOOGLE_REDIRECT_URI': JSON.stringify(process.env.VITE_API_URL ? `${process.env.VITE_API_URL}/api/auth/google/callback` : 'https://api.present.attadia.com/api/auth/google/callback')
  }
}) 