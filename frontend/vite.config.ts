import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:3001";

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("/react/") || id.includes("/react-dom/")) {
              return "react-vendor";
            }

            if (id.includes("/axios/")) {
              return "http-vendor";
            }
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": apiProxyTarget,
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
