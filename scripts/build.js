const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(srcDir, 'index.html');
const styleCssPath = path.join(srcDir, 'style.css');
const gameJsPath = path.join(srcDir, 'game.js');
const outputHtmlPath = path.join(distDir, 'pixel_dino_game.html');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Read files
let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
const cssContent = fs.readFileSync(styleCssPath, 'utf8');
const jsContent = fs.readFileSync(gameJsPath, 'utf8');

// Inline CSS
// Replace <link rel="stylesheet" href="style.css"> with <style>...</style>
htmlContent = htmlContent.replace(
    /<link\s+rel="stylesheet"\s+href="style\.css">/,
    `<style>\n${cssContent}\n</style>`
);

// Inline JS
// Replace <script src="game.js"></script> with <script>...</script>
htmlContent = htmlContent.replace(
    /<script\s+src="game\.js"><\/script>/,
    `<script>\n${jsContent}\n</script>`
);

// Write output
fs.writeFileSync(outputHtmlPath, htmlContent);

console.log(`Build successful! Output file: ${outputHtmlPath}`);
console.log(`Original size (approx): ${htmlContent.length} bytes`);
