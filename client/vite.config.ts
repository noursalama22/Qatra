import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: {
      "X-Frame-Options": "",
      "Content-Security-Policy": "frame-ancestors *",
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
