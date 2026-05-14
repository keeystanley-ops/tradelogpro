
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const outDir = path.join(root, 'out');
const apiDistDir = path.join(outDir, 'api-dist');
const apiDir = path.join(outDir, 'api');

// Clean out directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}

// Create directories
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(apiDistDir, { recursive: true });
fs.mkdirSync(apiDir, { recursive: true });

// Helper to copy directory contents
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Populating out directory...');

// Copy frontend dist
copyDir(path.join(root, 'artifacts/trading-journal/dist/public'), outDir);

// Copy backend dist
copyDir(path.join(root, 'artifacts/api-server/dist'), apiDistDir);

// Copy api helper
copyDir(path.join(root, 'api'), apiDir);

console.log('Out directory populated successfully.');
