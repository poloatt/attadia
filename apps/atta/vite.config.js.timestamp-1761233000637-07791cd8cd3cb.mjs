// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/polo/OneDrive/Documentos/GitHub/attadia/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/polo/OneDrive/Documentos/GitHub/attadia/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\polo\\OneDrive\\Documentos\\GitHub\\attadia\\apps\\atta";
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
      port: 5174,
      strictPort: true,
      hmr: {
        clientPort: 5174,
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
          "**/apps/pulso/**",
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
      port: 5174
    },
    define: {
      "import.meta.env.VITE_ENVIRONMENT": JSON.stringify(mode),
      "import.meta.env.MODE": JSON.stringify(mode),
      "import.meta.env.VITE_APP_NAME": JSON.stringify("Atta"),
      "import.meta.env.VITE_API_URL": JSON.stringify(appEnv.VITE_API_URL || ""),
      "import.meta.env.VITE_FRONTEND_URL": JSON.stringify(
        process.env.VITE_FRONTEND_URL || "https://atta.attadia.com"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcR2l0SHViXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxhdHRhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcR2l0SHViXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxhdHRhXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9wb2xvL09uZURyaXZlL0RvY3VtZW50b3MvR2l0SHViL2F0dGFkaWEvYXBwcy9hdHRhL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIC8vIEZvcnphciBtb2RvIHByb2R1Y2NpXHUwMEYzbiBzaSBWSVRFX0FQSV9VUkwgZXN0XHUwMEUxIGRlZmluaWRvXHJcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nIHx8IHByb2Nlc3MuZW52LlZJVEVfQVBJX1VSTDtcclxuICBcclxuICAvLyBDYXJnYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICBjb25zdCBhcHBFbnYgPSBsb2FkRW52KG1vZGUsIF9fZGlybmFtZSwgJycpXHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKVxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQHNoYXJlZCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zaGFyZWQnKSxcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgcG9ydDogNTE3NCxcclxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgICAgaG1yOiB7XHJcbiAgICAgICAgY2xpZW50UG9ydDogNTE3NCxcclxuICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgfSxcclxuICAgICAgd2F0Y2g6IHtcclxuICAgICAgICB1c2VQb2xsaW5nOiBmYWxzZSwgLy8gVXNhciBmaWxlIHdhdGNoaW5nIG5hdGl2byAobVx1MDBFMXMgclx1MDBFMXBpZG8pXHJcbiAgICAgICAgaW50ZXJ2YWw6IDEwMDAsXHJcbiAgICAgICAgLy8gU29sbyBvYnNlcnZhciBjYW1iaW9zIGVuIGxhIGFwcCBhY3R1YWwgeSBzaGFyZWRcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAnKiovbm9kZV9tb2R1bGVzLyoqJyxcclxuICAgICAgICAgICcqKi9kaXN0LyoqJyxcclxuICAgICAgICAgICcqKi8uZ2l0LyoqJyxcclxuICAgICAgICAgICcqKi9hcHBzL2ZvY28vKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvcHVsc28vKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvYmFja2VuZC8qKidcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6IGFwcEVudi5WSVRFX0FQSV9VUkwgfHwgKG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyA6ICdodHRwczovL2FwaS5hdHRhZGlhLmNvbScpLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgc2VjdXJlOiBtb2RlICE9PSAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgICAgICAgd3M6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjYWNoZURpcjogcHJvY2Vzcy5lbnYuVklURV9DQUNIRV9ESVIgfHwgJ25vZGVfbW9kdWxlcy8udml0ZScsXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgaW5jbHVkZTogW1xyXG4gICAgICAgICdAbXVpL21hdGVyaWFsJyxcclxuICAgICAgICAnQGVtb3Rpb24vcmVhY3QnLFxyXG4gICAgICAgICdAZW1vdGlvbi9zdHlsZWQnLFxyXG4gICAgICAgICdAbXVpL2ljb25zLW1hdGVyaWFsJyxcclxuICAgICAgICAnQG11aS94LWRhdGUtcGlja2VycycsXHJcbiAgICAgICAgJ2RhdGUtZm5zJyxcclxuICAgICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICAgJ25vdGlzdGFjaycsXHJcbiAgICAgICAgJ2F4aW9zJyxcclxuICAgICAgICAnc2hhcmVkJ1xyXG4gICAgICBdLFxyXG4gICAgICBmb3JjZTogZmFsc2UgLy8gU29sbyByZW9wdGltaXphciBjdWFuZG8gc2VhIG5lY2VzYXJpb1xyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgICBzb3VyY2VtYXA6ICFpc1Byb2QsXHJcbiAgICAgIG1pbmlmeTogaXNQcm9kLFxyXG4gICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgIG11aTogWydAbXVpL21hdGVyaWFsJywgJ0BtdWkvaWNvbnMtbWF0ZXJpYWwnXSxcclxuICAgICAgICAgICAgdXRpbHM6IFsnYXhpb3MnLCAnZGF0ZS1mbnMnLCAnbm90aXN0YWNrJ10sXHJcbiAgICAgICAgICAgIHNoYXJlZDogWydzaGFyZWQnXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHByZXZpZXc6IHtcclxuICAgICAgcG9ydDogNTE3NFxyXG4gICAgfSxcclxuICAgIGRlZmluZToge1xyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRU5WSVJPTk1FTlQnOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcclxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5NT0RFJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfTkFNRSc6IEpTT04uc3RyaW5naWZ5KCdBdHRhJyksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUElfVVJMJzogSlNPTi5zdHJpbmdpZnkoYXBwRW52LlZJVEVfQVBJX1VSTCB8fCAnJyksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9GUk9OVEVORF9VUkwnOiBKU09OLnN0cmluZ2lmeShcclxuICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0ZST05URU5EX1VSTCB8fCAnaHR0cHM6Ly9hdHRhLmF0dGFkaWEuY29tJ1xyXG4gICAgICApLFxyXG4gICAgICAvLyBDb21iaW5hciB2YXJpYWJsZXMgZGUgZW50b3JubyBlc3BlY1x1MDBFRGZpY2FzIGRlIGxhIGFwcFxyXG4gICAgICAuLi5PYmplY3Qua2V5cyhhcHBFbnYpLnJlZHVjZSgocHJldiwga2V5KSA9PiB7XHJcbiAgICAgICAgcHJldltgcHJvY2Vzcy5lbnYuJHtrZXl9YF0gPSBKU09OLnN0cmluZ2lmeShhcHBFbnZba2V5XSlcclxuICAgICAgICByZXR1cm4gcHJldlxyXG4gICAgICB9LCB7fSlcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1gsU0FBUyxjQUFjLGVBQWU7QUFDeFosT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLFNBQVMsU0FBUyxnQkFBZ0IsUUFBUSxJQUFJO0FBR3BELFFBQU0sU0FBUyxRQUFRLE1BQU0sa0NBQVcsRUFBRTtBQUUxQyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsV0FBVyxLQUFLLFFBQVEsa0NBQVcsV0FBVztBQUFBLFFBQzlDLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLEtBQUs7QUFBQSxRQUNILFlBQVk7QUFBQSxRQUNaLE1BQU07QUFBQSxNQUNSO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxZQUFZO0FBQUE7QUFBQSxRQUNaLFVBQVU7QUFBQTtBQUFBLFFBRVYsU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRLE9BQU8saUJBQWlCLFNBQVMsZ0JBQWdCLDBCQUEwQjtBQUFBLFVBQ25GLGNBQWM7QUFBQSxVQUNkLFFBQVEsU0FBUztBQUFBLFVBQ2pCLElBQUk7QUFBQSxRQUNOO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFVBQVUsUUFBUSxJQUFJLGtCQUFrQjtBQUFBLElBQ3hDLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTztBQUFBO0FBQUEsSUFDVDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVyxDQUFDO0FBQUEsTUFDWixRQUFRO0FBQUEsTUFDUixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFlBQ2pELEtBQUssQ0FBQyxpQkFBaUIscUJBQXFCO0FBQUEsWUFDNUMsT0FBTyxDQUFDLFNBQVMsWUFBWSxXQUFXO0FBQUEsWUFDeEMsUUFBUSxDQUFDLFFBQVE7QUFBQSxVQUNuQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLG9DQUFvQyxLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQ3ZELHdCQUF3QixLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQzNDLGlDQUFpQyxLQUFLLFVBQVUsTUFBTTtBQUFBLE1BQ3RELGdDQUFnQyxLQUFLLFVBQVUsT0FBTyxnQkFBZ0IsRUFBRTtBQUFBLE1BQ3hFLHFDQUFxQyxLQUFLO0FBQUEsUUFDeEMsUUFBUSxJQUFJLHFCQUFxQjtBQUFBLE1BQ25DO0FBQUE7QUFBQSxNQUVBLEdBQUcsT0FBTyxLQUFLLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxRQUFRO0FBQzNDLGFBQUssZUFBZSxHQUFHLEVBQUUsSUFBSSxLQUFLLFVBQVUsT0FBTyxHQUFHLENBQUM7QUFDdkQsZUFBTztBQUFBLE1BQ1QsR0FBRyxDQUFDLENBQUM7QUFBQSxJQUNQO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
