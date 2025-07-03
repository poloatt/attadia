import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isStaging = mode === 'staging';
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Present',
          short_name: 'Present',
          start_url: '.',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#1976d2',
          icons: [
            {
              src: 'images/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'images/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
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
        isStaging 
          ? 'https://api.staging.present.attadia.com'
          : (process.env.VITE_API_URL || 'https://api.present.attadia.com')
      )
    }
  }
}) 