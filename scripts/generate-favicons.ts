#!/usr/bin/env node

/**
 * Comprehensive Favicon Generator Script
 * 
 * This script generates multiple favicon formats and sizes from a source image
 * Supports ICO, PNG, SVG formats with various sizes for optimal browser support
 * 
 * Usage:
 * - Place your source favicon image in /public/favicon-source.png (recommended 512x512 or higher)
 * - Run: npm run generate-favicons
 * - Or: npx tsx scripts/generate-favicons.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface FaviconConfig {
  sizes: number[];
  formats: ('png' | 'ico')[];
  outputDir: string;
  sourceFile: string;
}

const config: FaviconConfig = {
  sizes: [16, 32, 48, 64, 96, 128, 180, 192, 256, 512],
  formats: ['png', 'ico'],
  outputDir: path.join(process.cwd(), 'public'),
  sourceFile: path.join(process.cwd(), 'public', 'favicon-source.png')
};

class FaviconGenerator {
  private config: FaviconConfig;

  constructor(config: FaviconConfig) {
    this.config = config;
  }

  /**
   * Check if ImageMagick is available
   */
  private checkImageMagick(): boolean {
    try {
      execSync('magick -version', { stdio: 'ignore' });
      return true;
    } catch {
      try {
        execSync('convert -version', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Check if source file exists
   */
  private checkSourceFile(): boolean {
    return fs.existsSync(this.config.sourceFile);
  }

  /**
   * Generate PNG favicons of various sizes
   */
  private generatePngFavicons(): void {
    console.log('🖼️  Generating PNG favicons...');
    
    for (const size of this.config.sizes) {
      const outputFile = path.join(this.config.outputDir, `favicon-${size}x${size}.png`);
      
      try {
        const command = this.checkImageMagick() 
          ? `magick "${this.config.sourceFile}" -resize ${size}x${size} "${outputFile}"`
          : `convert "${this.config.sourceFile}" -resize ${size}x${size} "${outputFile}"`;
        
        execSync(command, { stdio: 'ignore' });
        console.log(`  ✅ Generated ${size}x${size} PNG`);
      } catch (error) {
        console.error(`  ❌ Failed to generate ${size}x${size} PNG:`, error);
      }
    }
  }

  /**
   * Generate ICO favicon with multiple sizes
   */
  private generateIcoFavicon(): void {
    console.log('🔷 Generating ICO favicon...');
    
    const icoSizes = [16, 32, 48];
    const tempFiles: string[] = [];
    
    try {
      // Generate temporary PNG files for ICO creation
      for (const size of icoSizes) {
        const tempFile = path.join(this.config.outputDir, `temp-${size}.png`);
        const command = this.checkImageMagick()
          ? `magick "${this.config.sourceFile}" -resize ${size}x${size} "${tempFile}"`
          : `convert "${this.config.sourceFile}" -resize ${size}x${size} "${tempFile}"`;
        
        execSync(command, { stdio: 'ignore' });
        tempFiles.push(tempFile);
      }
      
      // Combine into ICO file
      const icoFile = path.join(this.config.outputDir, 'favicon.ico');
      const command = this.checkImageMagick()
        ? `magick ${tempFiles.map(f => `"${f}"`).join(' ')} "${icoFile}"`
        : `convert ${tempFiles.map(f => `"${f}"`).join(' ')} "${icoFile}"`;
      
      execSync(command, { stdio: 'ignore' });
      console.log('  ✅ Generated favicon.ico');
      
      // Clean up temporary files
      tempFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
      
    } catch (error) {
      console.error('  ❌ Failed to generate ICO favicon:', error);
      
      // Clean up temporary files on error
      tempFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    }
  }

  /**
   * Generate Apple Touch Icons
   */
  private generateAppleTouchIcons(): void {
    console.log('🍎 Generating Apple Touch Icons...');
    
    const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];
    
    for (const size of appleSizes) {
      const outputFile = path.join(this.config.outputDir, `apple-touch-icon-${size}x${size}.png`);
      
      try {
        const command = this.checkImageMagick()
          ? `magick "${this.config.sourceFile}" -resize ${size}x${size} "${outputFile}"`
          : `convert "${this.config.sourceFile}" -resize ${size}x${size} "${outputFile}"`;
        
        execSync(command, { stdio: 'ignore' });
        console.log(`  ✅ Generated Apple Touch Icon ${size}x${size}`);
      } catch (error) {
        console.error(`  ❌ Failed to generate Apple Touch Icon ${size}x${size}:`, error);
      }
    }

    // Generate default apple-touch-icon.png (180x180)
    try {
      const defaultAppleIcon = path.join(this.config.outputDir, 'apple-touch-icon.png');
      const command = this.checkImageMagick()
        ? `magick "${this.config.sourceFile}" -resize 180x180 "${defaultAppleIcon}"`
        : `convert "${this.config.sourceFile}" -resize 180x180 "${defaultAppleIcon}"`;
      
      execSync(command, { stdio: 'ignore' });
      console.log('  ✅ Generated default apple-touch-icon.png');
    } catch (error) {
      console.error('  ❌ Failed to generate default apple-touch-icon.png:', error);
    }
  }

  /**
   * Generate Android Chrome Icons
   */
  private generateAndroidIcons(): void {
    console.log('🤖 Generating Android Chrome Icons...');
    
    const androidSizes = [36, 48, 72, 96, 144, 192, 256, 384, 512];
    
    for (const size of androidSizes) {
      const outputFile = path.join(this.config.outputDir, `android-chrome-${size}x${size}.png`);
      
      try {
        const command = this.checkImageMagick()
          ? `magick "${this.config.sourceFile}" -resize ${size}x${size} "${outputFile}"`
          : `convert "${this.config.sourceFile}" -resize ${size}x${size} "${outputFile}"`;
        
        execSync(command, { stdio: 'ignore' });
        console.log(`  ✅ Generated Android Chrome Icon ${size}x${size}`);
      } catch (error) {
        console.error(`  ❌ Failed to generate Android Chrome Icon ${size}x${size}:`, error);
      }
    }
  }

  /**
   * Create a simple SVG favicon if source is not SVG
   */
  private generateSvgFavicon(): void {
    console.log('🎨 Generating SVG favicon...');
    
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#1a365d"/>
  <text x="16" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">R</text>
</svg>`;
    
    try {
      const svgFile = path.join(this.config.outputDir, 'favicon.svg');
      fs.writeFileSync(svgFile, svgContent);
      console.log('  ✅ Generated favicon.svg');
    } catch (error) {
      console.error('  ❌ Failed to generate SVG favicon:', error);
    }
  }

  /**
   * Generate web app manifest
   */
  private generateManifest(): void {
    console.log('📱 Generating web app manifest...');
    
    const manifest = {
      name: "RE/MAX Westside Realty",
      short_name: "Westside Realty",
      description: "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments.",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#1a365d",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/favicon.svg",
          sizes: "any",
          type: "image/svg+xml"
        }
      ]
    };
    
    try {
      const manifestFile = path.join(this.config.outputDir, 'site.webmanifest');
      fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
      console.log('  ✅ Generated site.webmanifest');
    } catch (error) {
      console.error('  ❌ Failed to generate manifest:', error);
    }
  }

  /**
   * Generate browserconfig.xml for Windows tiles
   */
  private generateBrowserConfig(): void {
    console.log('🪟 Generating browser config...');
    
    const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/favicon-256x256.png"/>
            <TileColor>#1a365d</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
    
    try {
      const configFile = path.join(this.config.outputDir, 'browserconfig.xml');
      fs.writeFileSync(configFile, browserConfig);
      console.log('  ✅ Generated browserconfig.xml');
    } catch (error) {
      console.error('  ❌ Failed to generate browser config:', error);
    }
  }

  /**
   * Main generation method
   */
  public async generate(): Promise<void> {
    console.log('🚀 Starting favicon generation...\n');
    
    // Check prerequisites
    if (!this.checkImageMagick()) {
      console.error('❌ ImageMagick is not installed. Please install ImageMagick to generate favicons.');
      console.log('   Install instructions:');
      console.log('   - macOS: brew install imagemagick');
      console.log('   - Ubuntu/Debian: sudo apt-get install imagemagick');
      console.log('   - Windows: Download from https://imagemagick.org/script/download.php#windows');
      process.exit(1);
    }
    
    if (!this.checkSourceFile()) {
      console.error(`❌ Source file not found: ${this.config.sourceFile}`);
      console.log('   Please place your source favicon image at /public/favicon-source.png');
      console.log('   Recommended size: 512x512 pixels or higher');
      process.exit(1);
    }
    
    console.log('✅ Prerequisites check passed\n');
    
    // Generate all favicon formats
    this.generatePngFavicons();
    this.generateIcoFavicon();
    this.generateAppleTouchIcons();
    this.generateAndroidIcons();
    this.generateSvgFavicon();
    this.generateManifest();
    this.generateBrowserConfig();
    
    console.log('\n🎉 Favicon generation completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your layout.tsx with the new favicon metadata');
    console.log('   2. Test favicons across different browsers and devices');
    console.log('   3. Consider adding the web app manifest link to your HTML head');
  }
}

// Run the generator if this script is executed directly
if (require.main === module) {
  const generator = new FaviconGenerator(config);
  generator.generate().catch(console.error);
}

export default FaviconGenerator;