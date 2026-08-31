const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(dir, { recursive: true });

// Minimal 1x1 green transparent PNG fallback
const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPifDwAEiAGk+JgY4QAAAABJRU5ErkJggg==', 'base64');

fs.writeFileSync(path.join(dir, 'icon.png'), minimalPng);
fs.writeFileSync(path.join(dir, 'adaptive-icon.png'), minimalPng);
fs.writeFileSync(path.join(dir, 'favicon.png'), minimalPng);
fs.writeFileSync(path.join(dir, 'splash-image.png'), minimalPng);

console.log('Created asset placeholders successfully');
