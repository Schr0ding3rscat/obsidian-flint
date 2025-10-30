import { defineConfig } from "vite";
import path from "path";

export default defineConfig(async () => {
  const { default: react } = await import("@vitejs/plugin-react");

  return {
    root: path.resolve(__dirname),
    base: "",
    plugins: [react()],
    build: {
      outDir: path.resolve(__dirname, "../../dist/renderer"),
      emptyOutDir: false,
      sourcemap: true
    },
    server: {
      fs: {
        allow: [path.resolve(__dirname, ".."), path.resolve(__dirname, "../../")]
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "../shared")
      }
    }
  };
});
