/**
 * Static Build Script for Fruit Catcher Game
 * Copies all production assets (index.html, style.css, script.js) into a clean /dist folder.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const filesToCopy = ['index.html', 'style.css', 'script.js'];

// Ensure dist directory exists and is clean
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy each file into dist
filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file} -> dist/${file}`);
  } else {
    console.warn(`! Warning: ${file} not found at ${src}`);
  }
});

console.log(' Build complete! Output directory: dist/');
