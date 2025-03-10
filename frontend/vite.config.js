import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  const apiUrl = {
    development: 'http://localhost:5000',
    staging: 'http://api.staging.present.attadia.com',
    production: 'https://api.present.attadia.com'
  }[mode] || env.VITE_API_URL

  const frontendUrl = {
    development: 'http://localhost:5173',
    staging: 'http://staging.present.attadia.com',
    production: 'https://present.attadia.com'
  }[mode] || env.VITE_FRONTEND_URL

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: parseInt(env.PORT || '5173'),
      strictPort: true,
      hmr: {
        clientPort: parseInt(env.PORT || '5173'),
        host: 'localhost',
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
      proxy: {
        '/api': {
          target: apiUrl,
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
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
          }
        }
      }
    },
    preview: {
      port: parseInt(env.PORT || '5173')
    },
    define: {
      'process.env': {},
      'import.meta.env.MODE': JSON.stringify(mode),
      'window.API_URL': JSON.stringify(apiUrl),
      'window.FRONTEND_URL': JSON.stringify(frontendUrl),
      'window.GOOGLE_REDIRECT_URI': JSON.stringify(`${apiUrl}/api/auth/google/callback`)
    }
  }
}) 