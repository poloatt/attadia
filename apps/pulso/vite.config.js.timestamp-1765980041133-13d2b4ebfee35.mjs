// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/polo/attadia/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/polo/attadia/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\polo\\attadia\\apps\\pulso";
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
      },
      dedupe: ["react", "react-dom"]
    },
    server: {
      host: "localhost",
      port: 5175,
      strictPort: true,
      hmr: {
        clientPort: 5175,
        host: "localhost",
        overlay: false
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
          "**/apps/backend/**",
          "**/.vite/**"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxwdWxzb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccG9sb1xcXFxhdHRhZGlhXFxcXGFwcHNcXFxccHVsc29cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3BvbG8vYXR0YWRpYS9hcHBzL3B1bHNvL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIC8vIEZvcnphciBtb2RvIHByb2R1Y2NpXHUwMEYzbiBzaSBWSVRFX0FQSV9VUkwgZXN0XHUwMEUxIGRlZmluaWRvXHJcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nIHx8IHByb2Nlc3MuZW52LlZJVEVfQVBJX1VSTDtcclxuICBcclxuICAvLyBDYXJnYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICBjb25zdCBhcHBFbnYgPSBsb2FkRW52KG1vZGUsIF9fZGlybmFtZSwgJycpXHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKVxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQHNoYXJlZCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zaGFyZWQnKSxcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgICBkZWR1cGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJ11cclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbiAgICAgIHBvcnQ6IDUxNzUsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICAgIGhtcjoge1xyXG4gICAgICAgIGNsaWVudFBvcnQ6IDUxNzUsXHJcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbiAgICAgICAgb3ZlcmxheTogZmFsc2VcclxuICAgICAgfSxcclxuICAgICAgd2F0Y2g6IHtcclxuICAgICAgICB1c2VQb2xsaW5nOiBmYWxzZSwgLy8gVXNhciBmaWxlIHdhdGNoaW5nIG5hdGl2byAobVx1MDBFMXMgclx1MDBFMXBpZG8pXHJcbiAgICAgICAgaW50ZXJ2YWw6IDEwMDAsXHJcbiAgICAgICAgLy8gU29sbyBvYnNlcnZhciBjYW1iaW9zIGVuIGxhIGFwcCBhY3R1YWwgeSBzaGFyZWRcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAnKiovbm9kZV9tb2R1bGVzLyoqJyxcclxuICAgICAgICAgICcqKi9kaXN0LyoqJyxcclxuICAgICAgICAgICcqKi8uZ2l0LyoqJyxcclxuICAgICAgICAgICcqKi9hcHBzL2ZvY28vKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvYXR0YS8qKicsXHJcbiAgICAgICAgICAnKiovYXBwcy9iYWNrZW5kLyoqJyxcclxuICAgICAgICAgICcqKi8udml0ZS8qKidcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6IGFwcEVudi5WSVRFX0FQSV9VUkwgfHwgKG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyA6ICdodHRwczovL2FwaS5hdHRhZGlhLmNvbScpLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgc2VjdXJlOiBtb2RlICE9PSAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgICAgICAgd3M6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjYWNoZURpcjogcHJvY2Vzcy5lbnYuVklURV9DQUNIRV9ESVIgfHwgJ25vZGVfbW9kdWxlcy8udml0ZScsXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgaW5jbHVkZTogW1xyXG4gICAgICAgICdAbXVpL21hdGVyaWFsJyxcclxuICAgICAgICAnQGVtb3Rpb24vcmVhY3QnLFxyXG4gICAgICAgICdAZW1vdGlvbi9zdHlsZWQnLFxyXG4gICAgICAgICdAbXVpL2ljb25zLW1hdGVyaWFsJyxcclxuICAgICAgICAnQG11aS94LWRhdGUtcGlja2VycycsXHJcbiAgICAgICAgJ2RhdGUtZm5zJyxcclxuICAgICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICAgJ25vdGlzdGFjaycsXHJcbiAgICAgICAgJ2F4aW9zJyxcclxuICAgICAgICAnc2hhcmVkJ1xyXG4gICAgICBdLFxyXG4gICAgICBmb3JjZTogZmFsc2UgLy8gU29sbyByZW9wdGltaXphciBjdWFuZG8gc2VhIG5lY2VzYXJpb1xyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgICBzb3VyY2VtYXA6ICFpc1Byb2QsXHJcbiAgICAgIG1pbmlmeTogaXNQcm9kLFxyXG4gICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgIG11aTogWydAbXVpL21hdGVyaWFsJywgJ0BtdWkvaWNvbnMtbWF0ZXJpYWwnXSxcclxuICAgICAgICAgICAgdXRpbHM6IFsnYXhpb3MnLCAnZGF0ZS1mbnMnLCAnbm90aXN0YWNrJ10sXHJcbiAgICAgICAgICAgIHNoYXJlZDogWydzaGFyZWQnXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHByZXZpZXc6IHtcclxuICAgICAgcG9ydDogNTE3NVxyXG4gICAgfSxcclxuICAgIGRlZmluZToge1xyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRU5WSVJPTk1FTlQnOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcclxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5NT0RFJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfTkFNRSc6IEpTT04uc3RyaW5naWZ5KCdQdWxzbycpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBJX1VSTCc6IEpTT04uc3RyaW5naWZ5KGFwcEVudi5WSVRFX0FQSV9VUkwgfHwgJycpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRlJPTlRFTkRfVVJMJzogSlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9GUk9OVEVORF9VUkwgfHwgJ2h0dHBzOi8vcHVsc28uYXR0YWRpYS5jb20nXHJcbiAgICAgICksXHJcbiAgICAgIC8vIENvbWJpbmFyIHZhcmlhYmxlcyBkZSBlbnRvcm5vIGVzcGVjXHUwMEVEZmljYXMgZGUgbGEgYXBwXHJcbiAgICAgIC4uLk9iamVjdC5rZXlzKGFwcEVudikucmVkdWNlKChwcmV2LCBrZXkpID0+IHtcclxuICAgICAgICBwcmV2W2Bwcm9jZXNzLmVudi4ke2tleX1gXSA9IEpTT04uc3RyaW5naWZ5KGFwcEVudltrZXldKVxyXG4gICAgICAgIHJldHVybiBwcmV2XHJcbiAgICAgIH0sIHt9KVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4UixTQUFTLGNBQWMsZUFBZTtBQUNwVSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sU0FBUyxTQUFTLGdCQUFnQixRQUFRLElBQUk7QUFHcEQsUUFBTSxTQUFTLFFBQVEsTUFBTSxrQ0FBVyxFQUFFO0FBRTFDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxXQUFXLEtBQUssUUFBUSxrQ0FBVyxXQUFXO0FBQUEsUUFDOUMsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsTUFDQSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsSUFDL0I7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLEtBQUs7QUFBQSxRQUNILFlBQVk7QUFBQSxRQUNaLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxZQUFZO0FBQUE7QUFBQSxRQUNaLFVBQVU7QUFBQTtBQUFBLFFBRVYsU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUSxPQUFPLGlCQUFpQixTQUFTLGdCQUFnQiwwQkFBMEI7QUFBQSxVQUNuRixjQUFjO0FBQUEsVUFDZCxRQUFRLFNBQVM7QUFBQSxVQUNqQixJQUFJO0FBQUEsUUFDTjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxVQUFVLFFBQVEsSUFBSSxrQkFBa0I7QUFBQSxJQUN4QyxjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLE9BQU87QUFBQTtBQUFBLElBQ1Q7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFdBQVcsQ0FBQztBQUFBLE1BQ1osUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFlBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxZQUNqRCxLQUFLLENBQUMsaUJBQWlCLHFCQUFxQjtBQUFBLFlBQzVDLE9BQU8sQ0FBQyxTQUFTLFlBQVksV0FBVztBQUFBLFlBQ3hDLFFBQVEsQ0FBQyxRQUFRO0FBQUEsVUFDbkI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixvQ0FBb0MsS0FBSyxVQUFVLElBQUk7QUFBQSxNQUN2RCx3QkFBd0IsS0FBSyxVQUFVLElBQUk7QUFBQSxNQUMzQyxpQ0FBaUMsS0FBSyxVQUFVLE9BQU87QUFBQSxNQUN2RCxnQ0FBZ0MsS0FBSyxVQUFVLE9BQU8sZ0JBQWdCLEVBQUU7QUFBQSxNQUN4RSxxQ0FBcUMsS0FBSztBQUFBLFFBQ3hDLFFBQVEsSUFBSSxxQkFBcUI7QUFBQSxNQUNuQztBQUFBO0FBQUEsTUFFQSxHQUFHLE9BQU8sS0FBSyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sUUFBUTtBQUMzQyxhQUFLLGVBQWUsR0FBRyxFQUFFLElBQUksS0FBSyxVQUFVLE9BQU8sR0FBRyxDQUFDO0FBQ3ZELGVBQU87QUFBQSxNQUNULEdBQUcsQ0FBQyxDQUFDO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
