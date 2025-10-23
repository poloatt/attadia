// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/polo/OneDrive/Documentos/GitHub/attadia/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/polo/OneDrive/Documentos/GitHub/attadia/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\polo\\OneDrive\\Documentos\\GitHub\\attadia\\apps\\pulso";
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
      port: 5175,
      strictPort: true,
      hmr: {
        clientPort: 5175,
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
          "**/apps/foco/**",
          "**/apps/atta/**",
          "**/apps/backend/**"
        ]
      },
      proxy: {
        "/api": {
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
      port: 5175
    },
    define: {
      "import.meta.env.VITE_ENVIRONMENT": JSON.stringify(mode),
      "import.meta.env.MODE": JSON.stringify(mode),
      "import.meta.env.VITE_APP_NAME": JSON.stringify("Pulso"),
      "import.meta.env.VITE_API_URL": JSON.stringify(appEnv.VITE_API_URL || ""),
      "import.meta.env.VITE_FRONTEND_URL": JSON.stringify(
        process.env.VITE_FRONTEND_URL || "https://pulso.attadia.com"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcR2l0SHViXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxwdWxzb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccG9sb1xcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXEdpdEh1YlxcXFxhdHRhZGlhXFxcXGFwcHNcXFxccHVsc29cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3BvbG8vT25lRHJpdmUvRG9jdW1lbnRvcy9HaXRIdWIvYXR0YWRpYS9hcHBzL3B1bHNvL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIC8vIEZvcnphciBtb2RvIHByb2R1Y2NpXHUwMEYzbiBzaSBWSVRFX0FQSV9VUkwgZXN0XHUwMEUxIGRlZmluaWRvXHJcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nIHx8IHByb2Nlc3MuZW52LlZJVEVfQVBJX1VSTDtcclxuICBcclxuICAvLyBDYXJnYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICBjb25zdCBhcHBFbnYgPSBsb2FkRW52KG1vZGUsIF9fZGlybmFtZSwgJycpXHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKVxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQHNoYXJlZCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zaGFyZWQnKSxcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgcG9ydDogNTE3NSxcclxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgICAgaG1yOiB7XHJcbiAgICAgICAgY2xpZW50UG9ydDogNTE3NSxcclxuICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgfSxcclxuICAgICAgd2F0Y2g6IHtcclxuICAgICAgICB1c2VQb2xsaW5nOiBmYWxzZSwgLy8gVXNhciBmaWxlIHdhdGNoaW5nIG5hdGl2byAobVx1MDBFMXMgclx1MDBFMXBpZG8pXHJcbiAgICAgICAgaW50ZXJ2YWw6IDEwMDAsXHJcbiAgICAgICAgLy8gU29sbyBvYnNlcnZhciBjYW1iaW9zIGVuIGxhIGFwcCBhY3R1YWwgeSBzaGFyZWRcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAnKiovbm9kZV9tb2R1bGVzLyoqJyxcclxuICAgICAgICAgICcqKi9kaXN0LyoqJyxcclxuICAgICAgICAgICcqKi8uZ2l0LyoqJyxcclxuICAgICAgICAgICcqKi9hcHBzL2ZvY28vKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvYXR0YS8qKicsXHJcbiAgICAgICAgICAnKiovYXBwcy9iYWNrZW5kLyoqJ1xyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogYXBwRW52LlZJVEVfQVBJX1VSTCB8fCAobW9kZSA9PT0gJ2RldmVsb3BtZW50JyA/ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnIDogJ2h0dHBzOi8vYXBpLmF0dGFkaWEuY29tJyksXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICBzZWN1cmU6IG1vZGUgIT09ICdkZXZlbG9wbWVudCcsXHJcbiAgICAgICAgICB3czogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNhY2hlRGlyOiBwcm9jZXNzLmVudi5WSVRFX0NBQ0hFX0RJUiB8fCAnbm9kZV9tb2R1bGVzLy52aXRlJyxcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICBpbmNsdWRlOiBbXHJcbiAgICAgICAgJ0BtdWkvbWF0ZXJpYWwnLFxyXG4gICAgICAgICdAZW1vdGlvbi9yZWFjdCcsXHJcbiAgICAgICAgJ0BlbW90aW9uL3N0eWxlZCcsXHJcbiAgICAgICAgJ0BtdWkvaWNvbnMtbWF0ZXJpYWwnLFxyXG4gICAgICAgICdAbXVpL3gtZGF0ZS1waWNrZXJzJyxcclxuICAgICAgICAnZGF0ZS1mbnMnLFxyXG4gICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcclxuICAgICAgICAnbm90aXN0YWNrJyxcclxuICAgICAgICAnYXhpb3MnLFxyXG4gICAgICAgICdzaGFyZWQnXHJcbiAgICAgIF0sXHJcbiAgICAgIGZvcmNlOiBmYWxzZSAvLyBTb2xvIHJlb3B0aW1pemFyIGN1YW5kbyBzZWEgbmVjZXNhcmlvXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICAgIHNvdXJjZW1hcDogIWlzUHJvZCxcclxuICAgICAgbWluaWZ5OiBpc1Byb2QsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgICAgbXVpOiBbJ0BtdWkvbWF0ZXJpYWwnLCAnQG11aS9pY29ucy1tYXRlcmlhbCddLFxyXG4gICAgICAgICAgICB1dGlsczogWydheGlvcycsICdkYXRlLWZucycsICdub3Rpc3RhY2snXSxcclxuICAgICAgICAgICAgc2hhcmVkOiBbJ3NoYXJlZCddXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJldmlldzoge1xyXG4gICAgICBwb3J0OiA1MTc1XHJcbiAgICB9LFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9FTlZJUk9OTUVOVCc6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52Lk1PREUnOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcclxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0FQUF9OQU1FJzogSlNPTi5zdHJpbmdpZnkoJ1B1bHNvJyksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUElfVVJMJzogSlNPTi5zdHJpbmdpZnkoYXBwRW52LlZJVEVfQVBJX1VSTCB8fCAnJyksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9GUk9OVEVORF9VUkwnOiBKU09OLnN0cmluZ2lmeShcclxuICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0ZST05URU5EX1VSTCB8fCAnaHR0cHM6Ly9wdWxzby5hdHRhZGlhLmNvbSdcclxuICAgICAgKSxcclxuICAgICAgLy8gQ29tYmluYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICAgICAgLi4uT2JqZWN0LmtleXMoYXBwRW52KS5yZWR1Y2UoKHByZXYsIGtleSkgPT4ge1xyXG4gICAgICAgIHByZXZbYHByb2Nlc3MuZW52LiR7a2V5fWBdID0gSlNPTi5zdHJpbmdpZnkoYXBwRW52W2tleV0pXHJcbiAgICAgICAgcmV0dXJuIHByZXZcclxuICAgICAgfSwge30pXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFYLFNBQVMsY0FBYyxlQUFlO0FBQzNaLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxTQUFTLFNBQVMsZ0JBQWdCLFFBQVEsSUFBSTtBQUdwRCxRQUFNLFNBQVMsUUFBUSxNQUFNLGtDQUFXLEVBQUU7QUFFMUMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLFdBQVcsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxRQUM5QyxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsUUFDSCxZQUFZO0FBQUEsUUFDWixNQUFNO0FBQUEsTUFDUjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsWUFBWTtBQUFBO0FBQUEsUUFDWixVQUFVO0FBQUE7QUFBQSxRQUVWLFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUSxPQUFPLGlCQUFpQixTQUFTLGdCQUFnQiwwQkFBMEI7QUFBQSxVQUNuRixjQUFjO0FBQUEsVUFDZCxRQUFRLFNBQVM7QUFBQSxVQUNqQixJQUFJO0FBQUEsUUFDTjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxVQUFVLFFBQVEsSUFBSSxrQkFBa0I7QUFBQSxJQUN4QyxjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLE9BQU87QUFBQTtBQUFBLElBQ1Q7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFdBQVcsQ0FBQztBQUFBLE1BQ1osUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFlBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxZQUNqRCxLQUFLLENBQUMsaUJBQWlCLHFCQUFxQjtBQUFBLFlBQzVDLE9BQU8sQ0FBQyxTQUFTLFlBQVksV0FBVztBQUFBLFlBQ3hDLFFBQVEsQ0FBQyxRQUFRO0FBQUEsVUFDbkI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixvQ0FBb0MsS0FBSyxVQUFVLElBQUk7QUFBQSxNQUN2RCx3QkFBd0IsS0FBSyxVQUFVLElBQUk7QUFBQSxNQUMzQyxpQ0FBaUMsS0FBSyxVQUFVLE9BQU87QUFBQSxNQUN2RCxnQ0FBZ0MsS0FBSyxVQUFVLE9BQU8sZ0JBQWdCLEVBQUU7QUFBQSxNQUN4RSxxQ0FBcUMsS0FBSztBQUFBLFFBQ3hDLFFBQVEsSUFBSSxxQkFBcUI7QUFBQSxNQUNuQztBQUFBO0FBQUEsTUFFQSxHQUFHLE9BQU8sS0FBSyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sUUFBUTtBQUMzQyxhQUFLLGVBQWUsR0FBRyxFQUFFLElBQUksS0FBSyxVQUFVLE9BQU8sR0FBRyxDQUFDO0FBQ3ZELGVBQU87QUFBQSxNQUNULEdBQUcsQ0FBQyxDQUFDO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
