// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/polo/OneDrive/Documentos/GitHub/attadia/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/polo/OneDrive/Documentos/GitHub/attadia/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\polo\\OneDrive\\Documentos\\GitHub\\attadia\\apps\\foco";
var vite_config_default = defineConfig(({ mode }) => {
  const isProd = mode === "production" || process.env.VITE_API_URL;
  const appEnv = loadEnv(mode, __vite_injected_original_dirname, "");
  return {
    base: "/",
    plugins: [
      react()
    ],
    resolve: {
      alias: {
        "@shared": path.resolve(__vite_injected_original_dirname, "../shared"),
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
      hmr: {
        clientPort: 5173,
        host: "localhost"
      },
      watch: {
        usePolling: false,
        // Usar file watching nativo (más rápido)
        interval: 1e3,
        // Solo observar cambios en la app actual y shared
        ignored: [
          "**/node_modules/**",
          "**/dist/**",
          "**/.git/**",
          "**/apps/atta/**",
          "**/apps/pulso/**",
          "**/apps/backend/**"
        ]
      },
      proxy: {
        "/api": {
          // En desarrollo usamos backend local por defecto
          target: appEnv.VITE_API_URL || (mode === "development" ? "http://localhost:5000" : "https://api.attadia.com"),
          changeOrigin: true,
          secure: mode !== "development",
          ws: true
        }
      }
    },
    cacheDir: process.env.VITE_CACHE_DIR || "node_modules/.vite",
    optimizeDeps: {
      include: [
        "@mui/material",
        "@emotion/react",
        "@emotion/styled",
        "@mui/icons-material",
        "@mui/x-date-pickers",
        "date-fns",
        "react-router-dom",
        "notistack",
        "axios",
        "shared"
      ],
      force: false
      // Solo reoptimizar cuando sea necesario
    },
    build: {
      outDir: "dist",
      sourcemap: !isProd,
      minify: isProd,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            mui: ["@mui/material", "@mui/icons-material"],
            utils: ["axios", "date-fns", "notistack"],
            shared: ["shared"]
          }
        }
      }
    },
    preview: {
      port: 5173
    },
    define: {
      "import.meta.env.VITE_ENVIRONMENT": JSON.stringify(mode),
      "import.meta.env.MODE": JSON.stringify(mode),
      "import.meta.env.VITE_APP_NAME": JSON.stringify("Foco"),
      // No forzar producción en dev; dejar vacío si no está definido
      "import.meta.env.VITE_API_URL": JSON.stringify(appEnv.VITE_API_URL || ""),
      "import.meta.env.VITE_FRONTEND_URL": JSON.stringify(
        process.env.VITE_FRONTEND_URL || "https://foco.attadia.com"
      ),
      // Combinar variables de entorno específicas de la app
      ...Object.keys(appEnv).reduce((prev, key) => {
        prev[`process.env.${key}`] = JSON.stringify(appEnv[key]);
        return prev;
      }, {})
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcR2l0SHViXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxmb2NvXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcR2l0SHViXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxmb2NvXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9wb2xvL09uZURyaXZlL0RvY3VtZW50b3MvR2l0SHViL2F0dGFkaWEvYXBwcy9mb2NvL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIC8vIEZvcnphciBtb2RvIHByb2R1Y2NpXHUwMEYzbiBzaSBWSVRFX0FQSV9VUkwgZXN0XHUwMEUxIGRlZmluaWRvXHJcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nIHx8IHByb2Nlc3MuZW52LlZJVEVfQVBJX1VSTDtcclxuICBcclxuICAvLyBDYXJnYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICBjb25zdCBhcHBFbnYgPSBsb2FkRW52KG1vZGUsIF9fZGlybmFtZSwgJycpXHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKVxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQHNoYXJlZCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zaGFyZWQnKSxcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgcG9ydDogNTE3MyxcclxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgICAgaG1yOiB7XHJcbiAgICAgICAgY2xpZW50UG9ydDogNTE3MyxcclxuICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgfSxcclxuICAgICAgd2F0Y2g6IHtcclxuICAgICAgICB1c2VQb2xsaW5nOiBmYWxzZSwgLy8gVXNhciBmaWxlIHdhdGNoaW5nIG5hdGl2byAobVx1MDBFMXMgclx1MDBFMXBpZG8pXHJcbiAgICAgICAgaW50ZXJ2YWw6IDEwMDAsXHJcbiAgICAgICAgLy8gU29sbyBvYnNlcnZhciBjYW1iaW9zIGVuIGxhIGFwcCBhY3R1YWwgeSBzaGFyZWRcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAnKiovbm9kZV9tb2R1bGVzLyoqJyxcclxuICAgICAgICAgICcqKi9kaXN0LyoqJyxcclxuICAgICAgICAgICcqKi8uZ2l0LyoqJyxcclxuICAgICAgICAgICcqKi9hcHBzL2F0dGEvKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvcHVsc28vKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvYmFja2VuZC8qKidcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICAvLyBFbiBkZXNhcnJvbGxvIHVzYW1vcyBiYWNrZW5kIGxvY2FsIHBvciBkZWZlY3RvXHJcbiAgICAgICAgICB0YXJnZXQ6IGFwcEVudi5WSVRFX0FQSV9VUkwgfHwgKG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyA6ICdodHRwczovL2FwaS5hdHRhZGlhLmNvbScpLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgc2VjdXJlOiBtb2RlICE9PSAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgICAgICAgd3M6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjYWNoZURpcjogcHJvY2Vzcy5lbnYuVklURV9DQUNIRV9ESVIgfHwgJ25vZGVfbW9kdWxlcy8udml0ZScsXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgaW5jbHVkZTogW1xyXG4gICAgICAgICdAbXVpL21hdGVyaWFsJyxcclxuICAgICAgICAnQGVtb3Rpb24vcmVhY3QnLFxyXG4gICAgICAgICdAZW1vdGlvbi9zdHlsZWQnLFxyXG4gICAgICAgICdAbXVpL2ljb25zLW1hdGVyaWFsJyxcclxuICAgICAgICAnQG11aS94LWRhdGUtcGlja2VycycsXHJcbiAgICAgICAgJ2RhdGUtZm5zJyxcclxuICAgICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICAgJ25vdGlzdGFjaycsXHJcbiAgICAgICAgJ2F4aW9zJyxcclxuICAgICAgICAnc2hhcmVkJ1xyXG4gICAgICBdLFxyXG4gICAgICBmb3JjZTogZmFsc2UgLy8gU29sbyByZW9wdGltaXphciBjdWFuZG8gc2VhIG5lY2VzYXJpb1xyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgICBzb3VyY2VtYXA6ICFpc1Byb2QsXHJcbiAgICAgIG1pbmlmeTogaXNQcm9kLFxyXG4gICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgIG11aTogWydAbXVpL21hdGVyaWFsJywgJ0BtdWkvaWNvbnMtbWF0ZXJpYWwnXSxcclxuICAgICAgICAgICAgdXRpbHM6IFsnYXhpb3MnLCAnZGF0ZS1mbnMnLCAnbm90aXN0YWNrJ10sXHJcbiAgICAgICAgICAgIHNoYXJlZDogWydzaGFyZWQnXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHByZXZpZXc6IHtcclxuICAgICAgcG9ydDogNTE3M1xyXG4gICAgfSxcclxuICAgIGRlZmluZToge1xyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRU5WSVJPTk1FTlQnOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcclxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5NT0RFJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfTkFNRSc6IEpTT04uc3RyaW5naWZ5KCdGb2NvJyksXHJcbiAgICAgIC8vIE5vIGZvcnphciBwcm9kdWNjaVx1MDBGM24gZW4gZGV2OyBkZWphciB2YWNcdTAwRURvIHNpIG5vIGVzdFx1MDBFMSBkZWZpbmlkb1xyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBJX1VSTCc6IEpTT04uc3RyaW5naWZ5KGFwcEVudi5WSVRFX0FQSV9VUkwgfHwgJycpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRlJPTlRFTkRfVVJMJzogSlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9GUk9OVEVORF9VUkwgfHwgJ2h0dHBzOi8vZm9jby5hdHRhZGlhLmNvbSdcclxuICAgICAgKSxcclxuICAgICAgLy8gQ29tYmluYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICAgICAgLi4uT2JqZWN0LmtleXMoYXBwRW52KS5yZWR1Y2UoKHByZXYsIGtleSkgPT4ge1xyXG4gICAgICAgIHByZXZbYHByb2Nlc3MuZW52LiR7a2V5fWBdID0gSlNPTi5zdHJpbmdpZnkoYXBwRW52W2tleV0pXHJcbiAgICAgICAgcmV0dXJuIHByZXZcclxuICAgICAgfSwge30pXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtYLFNBQVMsY0FBYyxlQUFlO0FBQ3haLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxTQUFTLFNBQVMsZ0JBQWdCLFFBQVEsSUFBSTtBQUdwRCxRQUFNLFNBQVMsUUFBUSxNQUFNLGtDQUFXLEVBQUU7QUFFMUMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLFdBQVcsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxRQUM5QyxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsUUFDSCxZQUFZO0FBQUEsUUFDWixNQUFNO0FBQUEsTUFDUjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsWUFBWTtBQUFBO0FBQUEsUUFDWixVQUFVO0FBQUE7QUFBQSxRQUVWLFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBO0FBQUEsVUFFTixRQUFRLE9BQU8saUJBQWlCLFNBQVMsZ0JBQWdCLDBCQUEwQjtBQUFBLFVBQ25GLGNBQWM7QUFBQSxVQUNkLFFBQVEsU0FBUztBQUFBLFVBQ2pCLElBQUk7QUFBQSxRQUNOO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFVBQVUsUUFBUSxJQUFJLGtCQUFrQjtBQUFBLElBQ3hDLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTztBQUFBO0FBQUEsSUFDVDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVyxDQUFDO0FBQUEsTUFDWixRQUFRO0FBQUEsTUFDUixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFlBQ2pELEtBQUssQ0FBQyxpQkFBaUIscUJBQXFCO0FBQUEsWUFDNUMsT0FBTyxDQUFDLFNBQVMsWUFBWSxXQUFXO0FBQUEsWUFDeEMsUUFBUSxDQUFDLFFBQVE7QUFBQSxVQUNuQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLG9DQUFvQyxLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQ3ZELHdCQUF3QixLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQzNDLGlDQUFpQyxLQUFLLFVBQVUsTUFBTTtBQUFBO0FBQUEsTUFFdEQsZ0NBQWdDLEtBQUssVUFBVSxPQUFPLGdCQUFnQixFQUFFO0FBQUEsTUFDeEUscUNBQXFDLEtBQUs7QUFBQSxRQUN4QyxRQUFRLElBQUkscUJBQXFCO0FBQUEsTUFDbkM7QUFBQTtBQUFBLE1BRUEsR0FBRyxPQUFPLEtBQUssTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLFFBQVE7QUFDM0MsYUFBSyxlQUFlLEdBQUcsRUFBRSxJQUFJLEtBQUssVUFBVSxPQUFPLEdBQUcsQ0FBQztBQUN2RCxlQUFPO0FBQUEsTUFDVCxHQUFHLENBQUMsQ0FBQztBQUFBLElBQ1A7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
