import { defineConfig } from "vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  base: "", // This ensures assets are loaded correctly in the Chrome extension
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        basicScript: path.resolve(__dirname, "src/basicScript.js"),
        simpleBackground: path.resolve(__dirname, "src/simpleBackground.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "basicScript") return "basicScript.js";
          if (chunkInfo.name === "simpleBackground") return "background.js";
          return "assets/[name]-[hash].js";
        },
      },
    },
    outDir: "dist",
  },
}));
