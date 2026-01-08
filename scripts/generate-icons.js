const fs = require('fs');
const path = require('path');

// This script generates placeholder PNG icons using Node.js canvas
// For production, use proper icon generation tools like:
// - https://realfavicongenerator.net/
// - https://www.pwabuilder.com/imageGenerator
// - Photoshop/Figma to export icons

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG icons for each size (can be used as fallback)
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#42047D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F6782F;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#gradient)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size*0.6}" fill="white">🧠</text>
</svg>`;

  const outputPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.svg`);
  fs.writeFileSync(outputPath, svg);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

// Create favicon.ico placeholder
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#42047D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F6782F;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="16" fill="url(#gradient)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="18" fill="white">🧠</text>
</svg>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log('Generated: favicon.svg');

console.log('\n✅ SVG icons generated successfully!');
console.log('\n📝 Note: SVG icons work in most modern browsers.');
console.log('For PNG conversion, you can:');
console.log('1. Use: https://realfavicongenerator.net/ (upload icon-base.svg)');
console.log('2. Use: https://www.pwabuilder.com/imageGenerator');
console.log('3. Use Figma/Photoshop to export at different sizes');
console.log('4. Use ImageMagick: convert icon-base.svg -resize 512x512 icon-512x512.png');










