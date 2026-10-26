import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Modo telemóvel (iniciar_telemovel.bat): o telemóvel só fala com este
    // servidor, que passa os pedidos /api ao Django neste computador.
    proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: true } },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/testes/preparar.js"],
  },
});
