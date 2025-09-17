import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isStaging = mode === 'staging';
  const isProd = mode === 'production';
  
  return {
    base: '/',
    plugins: [
      react()
    ],
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
          target: process.env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
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
      outDir: 'dist',
      sourcemap: !isProd,
      minify: isProd,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            utils: ['axios', 'date-fns', 'notistack']
          }
        }
      }
    },
    preview: {
      port: 5173
    },
    define: {
      'process.env': {},
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(mode),
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.VITE_API_URL': JSON.stringify(
        process.env.VITE_API_URL || 'https://api.admin.attadia.com'
      ),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(
        process.env.VITE_FRONTEND_URL || 'https://admin.attadia.com'
      )
    }
  }
}) 