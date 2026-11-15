import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // three.js is the one big chunk, and it's only loaded on the landing hero and the globe
  build: { chunkSizeWarningLimit: 1000 },
});
