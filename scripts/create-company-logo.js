#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createCompanyLogoPlaceholder() {
  const outputPath = path.join(process.cwd(), 'public', 'company-logo.png');
  
  console.log('🎨 Creating company logo placeholder...');
  
  try {
    // Create a simple company logo placeholder
    // This is a 512x512 PNG with your company branding
    const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a365d;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2d5a87;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="512" height="512" fill="url(#grad1)" rx="64"/>
      
      <!-- Company Initial or Logo -->
      <circle cx="256" cy="200" r="80" fill="white" opacity="0.9"/>
      <text x="256" y="230" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="#1a365d">R</text>
      
      <!-- Company Name -->
      <text x="256" y="320" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="white">RE/MAX</text>
      <text x="256" y="360" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" fill="white" opacity="0.9">Westside Realty</text>
      
      <!-- Decorative elements -->
      <rect x="156" y="380" width="200" height="3" fill="white" opacity="0.6"/>
      <circle cx="180" cy="420" r="4" fill="white" opacity="0.7"/>
      <circle cx="256" cy="420" r="4" fill="white" opacity="0.7"/>
      <circle cx="332" cy="420" r="4" fill="white" opacity="0.7"/>
    </svg>`;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created company logo placeholder at: ${outputPath}`);
    console.log('📝 Replace this with your actual company logo for best results');
    
    return outputPath;
  } catch (error) {
    console.error('❌ Error creating company logo placeholder:', error);
    throw error;
  }
}

module.exports = { createCompanyLogoPlaceholder };

// Run if called directly
if (require.main === module) {
  createCompanyLogoPlaceholder()
    .then((logoPath) => {
      console.log('\n🔧 Next step: Run favicon generation');
      console.log(`node scripts/favicon-with-sharp.js "${logoPath}"`);
    })
    .catch(console.error);
}