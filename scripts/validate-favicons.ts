#!/usr/bin/env node

/**
 * Favicon Validation Script
 * 
 * This script validates that all required favicon files exist and are properly configured
 * Helps ensure comprehensive browser and device support
 * 
 * Usage: npm run validate-favicons
 */

import fs from 'fs';
import path from 'path';

interface FaviconFile {
  path: string;
  description: string;
  required: boolean;
  sizes?: string;
}

const requiredFaviconFiles: FaviconFile[] = [
  // Core favicon files
  { path: 'favicon.ico', description: 'Traditional ICO favicon', required: true },
  { path: 'favicon.svg', description: 'Vector SVG favicon', required: true },
  
  // Standard PNG favicons
  { path: 'favicon-16x16.png', description: 'Standard 16x16 favicon', required: true, sizes: '16x16' },
  { path: 'favicon-32x32.png', description: 'Standard 32x32 favicon', required: true, sizes: '32x32' },
  { path: 'favicon-96x96.png', description: 'Standard 96x96 favicon', required: true, sizes: '96x96' },
  { path: 'favicon-192x192.png', description: 'Standard 192x192 favicon', required: true, sizes: '192x192' },
  
  // Apple Touch Icons
  { path: 'apple-touch-icon.png', description: 'Default Apple Touch Icon', required: true, sizes: '180x180' },
  { path: 'apple-touch-icon-57x57.png', description: 'Apple Touch Icon 57x57', required: false, sizes: '57x57' },
  { path: 'apple-touch-icon-60x60.png', description: 'Apple Touch Icon 60x60', required: false, sizes: '60x60' },
  { path: 'apple-touch-icon-72x72.png', description: 'Apple Touch Icon 72x72', required: false, sizes: '72x72' },
  { path: 'apple-touch-icon-76x76.png', description: 'Apple Touch Icon 76x76', required: false, sizes: '76x76' },
  { path: 'apple-touch-icon-114x114.png', description: 'Apple Touch Icon 114x114', required: false, sizes: '114x114' },
  { path: 'apple-touch-icon-120x120.png', description: 'Apple Touch Icon 120x120', required: false, sizes: '120x120' },
  { path: 'apple-touch-icon-144x144.png', description: 'Apple Touch Icon 144x144', required: false, sizes: '144x144' },
  { path: 'apple-touch-icon-152x152.png', description: 'Apple Touch Icon 152x152', required: false, sizes: '152x152' },
  { path: 'apple-touch-icon-180x180.png', description: 'Apple Touch Icon 180x180', required: false, sizes: '180x180' },
  
  // Android Chrome Icons
  { path: 'android-chrome-192x192.png', description: 'Android Chrome Icon 192x192', required: true, sizes: '192x192' },
  { path: 'android-chrome-512x512.png', description: 'Android Chrome Icon 512x512', required: true, sizes: '512x512' },
  
  // Configuration files
  { path: 'site.webmanifest', description: 'Web App Manifest', required: true },
  { path: 'browserconfig.xml', description: 'Windows Browser Config', required: false },
];

class FaviconValidator {
  private publicDir: string;
  private errors: string[] = [];
  private warnings: string[] = [];
  private passed: string[] = [];

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public');
  }

  /**
   * Check if a file exists and get its stats
   */
  private checkFile(filePath: string): { exists: boolean; size?: number } {
    const fullPath = path.join(this.publicDir, filePath);
    
    try {
      const stats = fs.statSync(fullPath);
      return { exists: true, size: stats.size };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Validate individual favicon file
   */
  private validateFile(file: FaviconFile): void {
    const { exists, size } = this.checkFile(file.path);
    
    if (!exists) {
      if (file.required) {
        this.errors.push(`❌ Missing required file: ${file.path} (${file.description})`);
      } else {
        this.warnings.push(`⚠️  Missing optional file: ${file.path} (${file.description})`);
      }
      return;
    }
    
    // File exists, check size
    if (size === 0) {
      this.errors.push(`❌ Empty file: ${file.path}`);
      return;
    }
    
    // Check if file size is reasonable
    const maxSize = file.path.endsWith('.ico') ? 50000 : 100000; // 50KB for ICO, 100KB for others
    if (size && size > maxSize) {
      this.warnings.push(`⚠️  Large file size: ${file.path} (${Math.round(size / 1024)}KB)`);
    }
    
    this.passed.push(`✅ ${file.path} (${file.description}) - ${Math.round((size || 0) / 1024)}KB`);
  }

  /**
   * Validate web app manifest content
   */
  private validateManifest(): void {
    const manifestPath = path.join(this.publicDir, 'site.webmanifest');
    
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      
      // Check required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length > 0) {
        this.errors.push(`❌ Manifest missing fields: ${missingFields.join(', ')}`);
      }
      
      // Check icons array
      if (manifest.icons && Array.isArray(manifest.icons)) {
        if (manifest.icons.length === 0) {
          this.warnings.push(`⚠️  Manifest has no icons defined`);
        } else {
          this.passed.push(`✅ Manifest has ${manifest.icons.length} icons defined`);
        }
      }
      
      // Check theme color
      if (manifest.theme_color) {
        this.passed.push(`✅ Manifest theme color: ${manifest.theme_color}`);
      } else {
        this.warnings.push(`⚠️  Manifest missing theme_color`);
      }
      
    } catch (error) {
      this.errors.push(`❌ Invalid manifest JSON: ${error}`);
    }
  }

  /**
   * Validate layout.tsx metadata configuration
   */
  private validateLayoutMetadata(): void {
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    
    try {
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      
      // Check for favicon metadata
      if (layoutContent.includes('icons:')) {
        this.passed.push(`✅ Layout.tsx contains favicon metadata`);
      } else {
        this.errors.push(`❌ Layout.tsx missing favicon metadata`);
      }
      
      // Check for manifest link
      if (layoutContent.includes('manifest:')) {
        this.passed.push(`✅ Layout.tsx includes manifest link`);
      } else {
        this.warnings.push(`⚠️  Layout.tsx missing manifest link`);
      }
      
      // Check for theme color
      if (layoutContent.includes('theme-color')) {
        this.passed.push(`✅ Layout.tsx includes theme-color`);
      } else {
        this.warnings.push(`⚠️  Layout.tsx missing theme-color`);
      }
      
    } catch (error) {
      this.errors.push(`❌ Cannot read layout.tsx: ${error}`);
    }
  }

  /**
   * Run complete validation
   */
  public validate(): void {
    console.log('🔍 Validating favicon configuration...\n');
    
    // Validate all favicon files
    requiredFaviconFiles.forEach(file => this.validateFile(file));
    
    // Validate manifest content
    this.validateManifest();
    
    // Validate layout metadata
    this.validateLayoutMetadata();
    
    // Display results
    this.displayResults();
  }

  /**
   * Display validation results
   */
  private displayResults(): void {
    console.log('📊 Validation Results:\n');
    
    // Show passed items
    if (this.passed.length > 0) {
      console.log('✅ PASSED:');
      this.passed.forEach(item => console.log(`  ${item}`));
      console.log('');
    }
    
    // Show warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
      console.log('');
    }
    
    // Show errors
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(`  ${error}`));
      console.log('');
    }
    
    // Summary
    const total = this.passed.length + this.warnings.length + this.errors.length;
    console.log(`📈 Summary: ${this.passed.length}/${total} checks passed`);
    
    if (this.errors.length > 0) {
      console.log(`\n🚨 ${this.errors.length} critical error(s) found. Please fix before deployment.`);
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warning(s) found. Consider addressing for optimal performance.`);
    } else {
      console.log(`\n🎉 All favicon checks passed! Your favicon configuration is complete.`);
    }
    
    console.log('\n💡 Tips:');
    console.log('  - Test favicons across different browsers and devices');
    console.log('  - Use browser dev tools to check for 404 errors');
    console.log('  - Consider using online favicon validators for additional checks');
    console.log('  - Run `npm run generate-favicons` to regenerate missing files');
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new FaviconValidator();
  validator.validate();
}

export default FaviconValidator;