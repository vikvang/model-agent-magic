// Post-build script to copy extension files to dist
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const srcFiles = ["contentScript.js", "background.js", "manifest.json"];

// Copy each file to dist
srcFiles.forEach((file) => {
  try {
    fs.copyFileSync(path.join(rootDir, file), path.join(rootDir, "dist", file));
    console.log(`Copied ${file} to dist/${file}`);
  } catch (error) {
    console.error(`Error copying ${file} to dist:`, error);
  }
});

console.log("Post-build file copying complete");
