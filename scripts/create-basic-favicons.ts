#!/usr/bin/env node

/**
 * Basic Favicon Creator
 * 
 * Creates basic favicon files when ImageMagick is not available
 * Uses simple SVG to create placeholder favicons
 */

import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

// Create basic SVG favicon templates for different sizes
const createSvgFavicon = (size: number, backgroundColor = '#1a365d', textColor = '#ffffff') => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${Math.max(2, size / 16)}"/>
  <g transform="translate(${size/2}, ${size/2})">
    <path d="M-${size/8},-${size/10} L0,-${size/5} L${size/8},-${size/10} Z" fill="${textColor}"/>
    <rect x="-${size/10}" y="-${size/10}" width="${size/5}" height="${size/4}" fill="${textColor}"/>
    <rect x="-${size/40}" y="${size/20}" width="${size/20}" height="${size/10}" fill="${backgroundColor}"/>
    <rect x="-${size/6}" y="-${size/30}" width="${size/15}" height="${size/15}" fill="${backgroundColor}"/>
    <rect x="${size/20}" y="-${size/30}" width="${size/15}" height="${size/15}" fill="${backgroundColor}"/>
  </g>
</svg>`;
};

// Create basic ICO file (simplified)
const createBasicIco = () => {
  // This is a very basic ICO file structure
  // In production, you'd want to use proper ICO generation
  const svg16 = createSvgFavicon(16);
  const svg32 = createSvgFavicon(32);
  
  // For now, we'll create a simple SVG-based favicon.ico
  // Note: This is a fallback - proper ICO generation requires specialized tools
  return svg32;
};

const faviconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

const appleIconSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];

console.log('🎨 Creating basic favicon files...\n');

// Create main favicon files
faviconSizes.forEach(({ name, size }) => {
  const svgContent = createSvgFavicon(size);
  const filePath = path.join(publicDir, name.replace('.png', '.svg'));
  
  try {
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created ${name.replace('.png', '.svg')}`);
  } catch (error) {
    console.error(`❌ Failed to create ${name}:`, error);
  }
});

// Create Apple Touch Icons
appleIconSizes.forEach(size => {
  const svgContent = createSvgFavicon(size);
  const fileName = `apple-touch-icon-${size}x${size}.svg`;
  const filePath = path.join(publicDir, fileName);
  
  try {
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to create ${fileName}:`, error);
  }
});

// Create a basic ICO file (as SVG for now)
try {
  const icoContent = createBasicIco();
  fs.writeFileSync(path.join(publicDir, 'favicon-basic.svg'), icoContent);
  console.log('✅ Created favicon-basic.svg (ICO fallback)');
} catch (error) {
  console.error('❌ Failed to create ICO fallback:', error);
}

console.log('\n📝 Note: These are basic SVG favicons.');
console.log('For production, consider using ImageMagick or online tools to generate proper PNG/ICO files.');
console.log('Run `npm run generate-favicons` after installing ImageMagick for optimal results.');

console.log('\n🎉 Basic favicon creation completed!');