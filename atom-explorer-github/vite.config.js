import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // 开发时把 /api 转发到生产服务器（node server.js，默认 8787），
    // 这样前端代码统一走 /api/chat，本地与公网行为一致
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
