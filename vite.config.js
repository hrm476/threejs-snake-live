// vite.config.js
import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";

export default defineConfig({
  // 使用相对路径输出，避免部署到子路径或本地文件时资源 404
  base: "./",
  plugins: [glsl()],
  build: {
    // 适当提升警告阈值（可按需调整）
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "three/examples/jsm/controls/OrbitControls.js"],
          gsap: ["gsap"]
        }
      }
    }
  },
  server: {
    port: 5175
  }
});
