const fs = require('fs');
const path = require('path');

// This script creates temporary SVG icons for PWA
// For production, convert these to PNG using one of these methods:
// 1. https://realfavicongenerator.net/ - Upload icon-base.svg
// 2. https://www.pwabuilder.com/imageGenerator - Automatic generation
// 3. ImageMagick: convert icon-base.svg -resize 512x512 icon-512x512.png

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

console.log('🎨 Setting up PWA icons...\n');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created icons directory');
}

// Create SVG icons for each size
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#42047D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F6782F;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#gradient)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size*0.6}" font-family="Arial, sans-serif">🧠</text>
</svg>`;

  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  fs.writeFileSync(svgPath, svg);
  
  // Create a placeholder notice for PNG
  if (!fs.existsSync(pngPath)) {
    console.log(`📝 Created SVG: icon-${size}x${size}.svg (PNG conversion needed)`);
  }
});

// Create favicon.ico notice
const favicoPath = path.join(__dirname, '..', 'public', 'favicon.ico');
if (!fs.existsSync(favicoPath)) {
  console.log('\n⚠️  favicon.ico not found');
  console.log('   Convert favicon.svg to favicon.ico using:');
  console.log('   - https://convertio.co/svg-ico/');
  console.log('   - https://favicon.io/favicon-converter/');
}

console.log('\n✅ SVG icons created successfully!');
console.log('\n📦 Next Steps for Production-Ready PNG Icons:');
console.log('   1. Visit: https://realfavicongenerator.net/');
console.log('   2. Upload: frontend/public/icons/icon-base.svg');
console.log('   3. Download generated PNG icons');
console.log('   4. Replace SVG files in frontend/public/icons/');
console.log('\n   OR use the icon generator at: http://localhost:8000/icon-generator.html');










