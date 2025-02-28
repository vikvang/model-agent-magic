import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Custom plugin to copy extension files to dist folder
function copyExtensionFiles() {
  return {
    name: "copy-extension-files",
    closeBundle: async () => {
      // Extension files to copy
      const filesToCopy = [
        { src: "manifest.json", dest: "dist/manifest.json" },
        { src: "contentScript.js", dest: "dist/contentScript.js" },
        { src: "background.js", dest: "dist/background.js" },
      ];

      // Create icons directory if needed
      if (!fs.existsSync("dist/icons")) {
        fs.mkdirSync("dist/icons", { recursive: true });
      }

      // Process each file
      for (const file of filesToCopy) {
        try {
          if (fs.existsSync(file.src)) {
            fs.copyFileSync(file.src, file.dest);
            console.log(`Copied ${file.src} to ${file.dest}`);
          } else {
            console.warn(`Source file not found: ${file.src}`);
          }
        } catch (error) {
          console.error(`Error copying ${file.src}:`, error);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: "", // This ensures assets are loaded correctly in the Chrome extension
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    copyExtensionFiles(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
}));
