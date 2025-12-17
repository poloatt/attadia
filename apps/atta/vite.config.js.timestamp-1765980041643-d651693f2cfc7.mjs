// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/polo/attadia/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/polo/attadia/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\polo\\attadia\\apps\\atta";
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
      port: 5174,
      strictPort: true,
      hmr: {
        clientPort: 5174,
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
          "**/apps/pulso/**",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxhdHRhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwb2xvXFxcXGF0dGFkaWFcXFxcYXBwc1xcXFxhdHRhXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9wb2xvL2F0dGFkaWEvYXBwcy9hdHRhL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIC8vIEZvcnphciBtb2RvIHByb2R1Y2NpXHUwMEYzbiBzaSBWSVRFX0FQSV9VUkwgZXN0XHUwMEUxIGRlZmluaWRvXHJcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nIHx8IHByb2Nlc3MuZW52LlZJVEVfQVBJX1VSTDtcclxuICBcclxuICAvLyBDYXJnYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICBjb25zdCBhcHBFbnYgPSBsb2FkRW52KG1vZGUsIF9fZGlybmFtZSwgJycpXHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKVxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQHNoYXJlZCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zaGFyZWQnKSxcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgICBkZWR1cGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJ11cclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbiAgICAgIHBvcnQ6IDUxNzQsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICAgIGhtcjoge1xyXG4gICAgICAgIGNsaWVudFBvcnQ6IDUxNzQsXHJcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbiAgICAgICAgb3ZlcmxheTogZmFsc2VcclxuICAgICAgfSxcclxuICAgICAgd2F0Y2g6IHtcclxuICAgICAgICB1c2VQb2xsaW5nOiBmYWxzZSwgLy8gVXNhciBmaWxlIHdhdGNoaW5nIG5hdGl2byAobVx1MDBFMXMgclx1MDBFMXBpZG8pXHJcbiAgICAgICAgaW50ZXJ2YWw6IDEwMDAsXHJcbiAgICAgICAgLy8gU29sbyBvYnNlcnZhciBjYW1iaW9zIGVuIGxhIGFwcCBhY3R1YWwgeSBzaGFyZWRcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAnKiovbm9kZV9tb2R1bGVzLyoqJyxcclxuICAgICAgICAgICcqKi9kaXN0LyoqJyxcclxuICAgICAgICAgICcqKi8uZ2l0LyoqJyxcclxuICAgICAgICAgICcqKi9hcHBzL2ZvY28vKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvcHVsc28vKionLFxyXG4gICAgICAgICAgJyoqL2FwcHMvYmFja2VuZC8qKicsXHJcbiAgICAgICAgICAnKiovLnZpdGUvKionXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICBwcm94eToge1xyXG4gICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiBhcHBFbnYuVklURV9BUElfVVJMIHx8IChtb2RlID09PSAnZGV2ZWxvcG1lbnQnID8gJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcgOiAnaHR0cHM6Ly9hcGkuYXR0YWRpYS5jb20nKSxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHNlY3VyZTogbW9kZSAhPT0gJ2RldmVsb3BtZW50JyxcclxuICAgICAgICAgIHdzOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY2FjaGVEaXI6IHByb2Nlc3MuZW52LlZJVEVfQ0FDSEVfRElSIHx8ICdub2RlX21vZHVsZXMvLnZpdGUnLFxyXG4gICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgIGluY2x1ZGU6IFtcclxuICAgICAgICAnQG11aS9tYXRlcmlhbCcsXHJcbiAgICAgICAgJ0BlbW90aW9uL3JlYWN0JyxcclxuICAgICAgICAnQGVtb3Rpb24vc3R5bGVkJyxcclxuICAgICAgICAnQG11aS9pY29ucy1tYXRlcmlhbCcsXHJcbiAgICAgICAgJ0BtdWkveC1kYXRlLXBpY2tlcnMnLFxyXG4gICAgICAgICdkYXRlLWZucycsXHJcbiAgICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxyXG4gICAgICAgICdub3Rpc3RhY2snLFxyXG4gICAgICAgICdheGlvcycsXHJcbiAgICAgICAgJ3NoYXJlZCdcclxuICAgICAgXSxcclxuICAgICAgZm9yY2U6IGZhbHNlIC8vIFNvbG8gcmVvcHRpbWl6YXIgY3VhbmRvIHNlYSBuZWNlc2FyaW9cclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgICAgc291cmNlbWFwOiAhaXNQcm9kLFxyXG4gICAgICBtaW5pZnk6IGlzUHJvZCxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxyXG4gICAgICAgICAgICBtdWk6IFsnQG11aS9tYXRlcmlhbCcsICdAbXVpL2ljb25zLW1hdGVyaWFsJ10sXHJcbiAgICAgICAgICAgIHV0aWxzOiBbJ2F4aW9zJywgJ2RhdGUtZm5zJywgJ25vdGlzdGFjayddLFxyXG4gICAgICAgICAgICBzaGFyZWQ6IFsnc2hhcmVkJ11cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwcmV2aWV3OiB7XHJcbiAgICAgIHBvcnQ6IDUxNzRcclxuICAgIH0sXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0VOVklST05NRU5UJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuTU9ERSc6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBQX05BTUUnOiBKU09OLnN0cmluZ2lmeSgnQXR0YScpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBJX1VSTCc6IEpTT04uc3RyaW5naWZ5KGFwcEVudi5WSVRFX0FQSV9VUkwgfHwgJycpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRlJPTlRFTkRfVVJMJzogSlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9GUk9OVEVORF9VUkwgfHwgJ2h0dHBzOi8vYXR0YS5hdHRhZGlhLmNvbSdcclxuICAgICAgKSxcclxuICAgICAgLy8gQ29tYmluYXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZXNwZWNcdTAwRURmaWNhcyBkZSBsYSBhcHBcclxuICAgICAgLi4uT2JqZWN0LmtleXMoYXBwRW52KS5yZWR1Y2UoKHByZXYsIGtleSkgPT4ge1xyXG4gICAgICAgIHByZXZbYHByb2Nlc3MuZW52LiR7a2V5fWBdID0gSlNPTi5zdHJpbmdpZnkoYXBwRW52W2tleV0pXHJcbiAgICAgICAgcmV0dXJuIHByZXZcclxuICAgICAgfSwge30pXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJSLFNBQVMsY0FBYyxlQUFlO0FBQ2pVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxTQUFTLFNBQVMsZ0JBQWdCLFFBQVEsSUFBSTtBQUdwRCxRQUFNLFNBQVMsUUFBUSxNQUFNLGtDQUFXLEVBQUU7QUFFMUMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLFdBQVcsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxRQUM5QyxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxNQUNBLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxJQUMvQjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osS0FBSztBQUFBLFFBQ0gsWUFBWTtBQUFBLFFBQ1osTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBLE9BQU87QUFBQSxRQUNMLFlBQVk7QUFBQTtBQUFBLFFBQ1osVUFBVTtBQUFBO0FBQUEsUUFFVixTQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRLE9BQU8saUJBQWlCLFNBQVMsZ0JBQWdCLDBCQUEwQjtBQUFBLFVBQ25GLGNBQWM7QUFBQSxVQUNkLFFBQVEsU0FBUztBQUFBLFVBQ2pCLElBQUk7QUFBQSxRQUNOO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFVBQVUsUUFBUSxJQUFJLGtCQUFrQjtBQUFBLElBQ3hDLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTztBQUFBO0FBQUEsSUFDVDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVyxDQUFDO0FBQUEsTUFDWixRQUFRO0FBQUEsTUFDUixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFlBQ2pELEtBQUssQ0FBQyxpQkFBaUIscUJBQXFCO0FBQUEsWUFDNUMsT0FBTyxDQUFDLFNBQVMsWUFBWSxXQUFXO0FBQUEsWUFDeEMsUUFBUSxDQUFDLFFBQVE7QUFBQSxVQUNuQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLG9DQUFvQyxLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQ3ZELHdCQUF3QixLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQzNDLGlDQUFpQyxLQUFLLFVBQVUsTUFBTTtBQUFBLE1BQ3RELGdDQUFnQyxLQUFLLFVBQVUsT0FBTyxnQkFBZ0IsRUFBRTtBQUFBLE1BQ3hFLHFDQUFxQyxLQUFLO0FBQUEsUUFDeEMsUUFBUSxJQUFJLHFCQUFxQjtBQUFBLE1BQ25DO0FBQUE7QUFBQSxNQUVBLEdBQUcsT0FBTyxLQUFLLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxRQUFRO0FBQzNDLGFBQUssZUFBZSxHQUFHLEVBQUUsSUFBSSxLQUFLLFVBQVUsT0FBTyxHQUFHLENBQUM7QUFDdkQsZUFBTztBQUFBLE1BQ1QsR0FBRyxDQUFDLENBQUM7QUFBQSxJQUNQO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
