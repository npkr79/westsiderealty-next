#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  // Core favicon files
  { path: 'public/favicon.ico', description: 'Legacy ICO favicon' },
  { path: 'public/favicon.svg', description: 'SVG favicon' },
  { path: 'src/app/favicon.ico', description: 'App directory favicon' },
  
  // PNG favicons
  { path: 'public/favicon-16x16.png', description: '16x16 PNG favicon' },
  { path: 'public/favicon-32x32.png', description: '32x32 PNG favicon' },
  { path: 'public/favicon-96x96.png', description: '96x96 PNG favicon' },
  { path: 'public/favicon-192x192.png', description: '192x192 PNG favicon' },
  
  // Mobile icons
  { path: 'public/apple-touch-icon.png', description: 'Apple Touch Icon' },
  { path: 'public/android-chrome-192x192.png', description: 'Android Chrome 192x192' },
  { path: 'public/android-chrome-512x512.png', description: 'Android Chrome 512x512' },
  
  // Configuration files
  { path: 'public/site.webmanifest', description: 'Web App Manifest' },
  { path: 'public/browserconfig.xml', description: 'Browser Config XML' },
];

function validateFaviconImplementation() {
  console.log('🔍 Validating favicon implementation...\n');
  
  let allValid = true;
  const results = [];
  
  // Check required files
  console.log('📁 Checking required files:');
  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file.path);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      const stats = fs.statSync(fullPath);
      console.log(`✅ ${file.description}: ${file.path} (${stats.size} bytes)`);
      results.push({ file: file.path, status: 'OK', size: stats.size });
    } else {
      console.log(`❌ ${file.description}: ${file.path} - MISSING`);
      results.push({ file: file.path, status: 'MISSING', size: 0 });
      allValid = false;
    }
  }
  
  // Check manifest content
  console.log('\n📱 Validating web manifest:');
  const manifestPath = path.join(process.cwd(), 'public/site.webmanifest');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (manifestContent.icons && manifestContent.icons.length > 0) {
        console.log(`✅ Web manifest has ${manifestContent.icons.length} icon entries`);
        
        // Validate each icon reference
        for (const icon of manifestContent.icons) {
          const iconPath = path.join(process.cwd(), 'public', icon.src.replace('/', ''));
          if (fs.existsSync(iconPath)) {
            console.log(`  ✅ Icon exists: ${icon.src} (${icon.sizes})`);
          } else {
            console.log(`  ❌ Icon missing: ${icon.src} (${icon.sizes})`);
            allValid = false;
          }
        }
      } else {
        console.log('❌ Web manifest has no icons defined');
        allValid = false;
      }
    } catch (error) {
      console.log('❌ Invalid JSON in web manifest');
      allValid = false;
    }
  }
  
  // Check layout.tsx metadata
  console.log('\n🔧 Checking layout.tsx metadata:');
  const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    if (layoutContent.includes('icons:') && layoutContent.includes('favicon')) {
      console.log('✅ Layout.tsx contains favicon metadata');
    } else {
      console.log('❌ Layout.tsx missing favicon metadata');
      allValid = false;
    }
    
    if (layoutContent.includes('manifest:')) {
      console.log('✅ Layout.tsx includes web manifest reference');
    } else {
      console.log('❌ Layout.tsx missing web manifest reference');
      allValid = false;
    }
  } else {
    console.log('❌ Layout.tsx not found');
    allValid = false;
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log('='.repeat(50));
  
  if (allValid) {
    console.log('🎉 All favicon files and configurations are valid!');
    console.log('\n✅ Your favicon implementation is complete and ready to use.');
    console.log('\n📋 Next steps:');
    console.log('   1. Replace /public/company-logo.png with your actual logo');
    console.log('   2. Run: node scripts/favicon-with-sharp.js');
    console.log('   3. Test in different browsers');
  } else {
    console.log('❌ Some issues were found in the favicon implementation.');
    console.log('   Please check the errors above and fix them.');
  }
  
  console.log('\n🔗 Files validated:');
  results.forEach(result => {
    const status = result.status === 'OK' ? '✅' : '❌';
    const size = result.size > 0 ? ` (${result.size} bytes)` : '';
    console.log(`   ${status} ${result.file}${size}`);
  });
  
  return allValid;
}

// Run validation if called directly
if (require.main === module) {
  const isValid = validateFaviconImplementation();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateFaviconImplementation };