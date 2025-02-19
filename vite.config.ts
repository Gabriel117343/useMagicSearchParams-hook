import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    postcss: "./postcss.config.js",
  },
  base: "/",
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom", // Asegúrate de que Vitest usa jsdom
    setupFiles: "./setup.jsdom.ts", // Ruta correcta al setup file
  },
});
