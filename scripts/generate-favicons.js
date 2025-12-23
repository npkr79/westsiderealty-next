#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration for different favicon sizes and formats
const faviconConfig = [
  // ICO format (for legacy browsers)
  { size: 16, format: 'ico', name: 'favicon.ico' },
  
  // PNG formats for different uses
  { size: 16, format: 'png', name: 'favicon-16x16.png' },
  { size: 32, format: 'png', name: 'favicon-32x32.png' },
  { size: 96, format: 'png', name: 'favicon-96x96.png' },
  { size: 192, format: 'png', name: 'favicon-192x192.png' },
  
  // Apple touch icon
  { size: 180, format: 'png', name: 'apple-touch-icon.png' },
  
  // Android Chrome icons
  { size: 192, format: 'png', name: 'android-chrome-192x192.png' },
  { size: 512, format: 'png', name: 'android-chrome-512x512.png' },
];

async function generateFavicons(sourceImagePath, outputDir = './public') {
  try {
    // Check if source image exists
    if (!fs.existsSync(sourceImagePath)) {
      console.error(`❌ Source image not found: ${sourceImagePath}`);
      console.log('\n📋 Instructions:');
      console.log('1. Place your company logo image in the public directory');
      console.log('2. Supported formats: PNG, JPG, JPEG, SVG');
      console.log('3. Recommended: Square image with minimum 512x512 pixels');
      console.log('4. Run: npm run generate-favicons path/to/your/logo.png');
      return;
    }

    console.log(`🎨 Generating favicons from: ${sourceImagePath}`);
    console.log(`📁 Output directory: ${outputDir}`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Process each favicon configuration
    for (const config of faviconConfig) {
      const outputPath = path.join(outputDir, config.name);
      
      console.log(`⚙️  Generating ${config.name} (${config.size}x${config.size})`);

      if (config.format === 'ico') {
        // For ICO format, we'll generate a PNG and then convert
        await sharp(sourceImagePath)
          .resize(config.size, config.size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputPath.replace('.ico', '.png'));
        
        // Note: For true ICO format, you might need additional tools
        // For now, we'll use PNG as it's widely supported
        console.log(`   ℹ️  Generated as PNG (ICO conversion requires additional tools)`);
      } else {
        await sharp(sourceImagePath)
          .resize(config.size, config.size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
      }
    }

    // Generate SVG favicon if source is not SVG
    const ext = path.extname(sourceImagePath).toLowerCase();
    if (ext !== '.svg') {
      console.log('⚙️  Generating favicon.svg');
      // For non-SVG sources, we'll create a simple SVG wrapper
      await generateSVGFavicon(sourceImagePath, path.join(outputDir, 'favicon.svg'));
    } else {
      // Copy SVG as-is
      fs.copyFileSync(sourceImagePath, path.join(outputDir, 'favicon.svg'));
      console.log('✅ Copied SVG favicon');
    }

    console.log('\n✅ Favicon generation completed!');
    console.log('\n📋 Generated files:');
    faviconConfig.forEach(config => {
      console.log(`   - ${config.name}`);
    });
    console.log('   - favicon.svg');

    console.log('\n🔧 Next steps:');
    console.log('1. Update your HTML head section with the new favicon links');
    console.log('2. Update site.webmanifest with the new icon references');
    console.log('3. Test the favicons in different browsers');

  } catch (error) {
    console.error('❌ Error generating favicons:', error);
  }
}

async function generateSVGFavicon(sourceImagePath, outputPath) {
  // Convert source image to base64 for embedding in SVG
  const imageBuffer = fs.readFileSync(sourceImagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(sourceImagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <image href="data:${mimeType};base64,${base64Image}" width="32" height="32" />
</svg>`;

  fs.writeFileSync(outputPath, svgContent);
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const sourceImage = args[0];
  const outputDir = args[1] || './public';

  if (!sourceImage) {
    console.log('🎨 Favicon Generator');
    console.log('\nUsage: node generate-favicons.js <source-image> [output-directory]');
    console.log('\nExample: node generate-favicons.js ./company-logo.png ./public');
    console.log('\n📋 Requirements:');
    console.log('- Source image should be square (1:1 aspect ratio)');
    console.log('- Minimum recommended size: 512x512 pixels');
    console.log('- Supported formats: PNG, JPG, JPEG, SVG');
    process.exit(1);
  }

  generateFavicons(sourceImage, outputDir);
}

module.exports = { generateFavicons };