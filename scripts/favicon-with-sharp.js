#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration for different favicon sizes and formats
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 192, name: 'favicon-192x192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

async function generateFaviconsWithSharp(sourceImagePath, outputDir = './public') {
  try {
    console.log(`🎨 Generating favicons from: ${sourceImagePath}`);
    console.log(`📁 Output directory: ${outputDir}`);

    // Check if source image exists
    if (!fs.existsSync(sourceImagePath)) {
      throw new Error(`Source image not found: ${sourceImagePath}`);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Process each favicon size
    for (const config of faviconSizes) {
      const outputPath = path.join(outputDir, config.name);
      
      console.log(`⚙️  Generating ${config.name} (${config.size}x${config.size})`);

      await sharp(sourceImagePath)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${config.name}`);
    }

    // Generate favicon.ico (using 32x32 as base)
    console.log('⚙️  Generating favicon.ico');
    await sharp(sourceImagePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.ico'));
    console.log('✅ Generated favicon.ico');

    // Generate SVG favicon
    console.log('⚙️  Generating favicon.svg');
    await generateSVGFavicon(sourceImagePath, path.join(outputDir, 'favicon.svg'));
    console.log('✅ Generated favicon.svg');

    console.log('\n🎉 Favicon generation completed!');
    console.log('\n📋 Generated files:');
    faviconSizes.forEach(config => {
      console.log(`   - ${config.name}`);
    });
    console.log('   - favicon.ico');
    console.log('   - favicon.svg');

  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    throw error;
  }
}

async function generateSVGFavicon(sourceImagePath, outputPath) {
  try {
    // For SVG, we'll create a simple version
    // In a real scenario, you might want to convert the image to SVG or use the original if it's already SVG
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#1a365d" rx="4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">R</text>
</svg>`;

    fs.writeFileSync(outputPath, svgContent);
  } catch (error) {
    console.error('Error generating SVG favicon:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { generateFaviconsWithSharp };

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const sourceImage = args[0] || './public/favicon-source.png';
  const outputDir = args[1] || './public';

  generateFaviconsWithSharp(sourceImage, outputDir)
    .then(() => {
      console.log('\n🔧 Next steps:');
      console.log('1. Update your HTML head section with the new favicon links');
      console.log('2. Update site.webmanifest with the new icon references');
      console.log('3. Test the favicons in different browsers');
    })
    .catch((error) => {
      console.error('Failed to generate favicons:', error.message);
      process.exit(1);
    });
}