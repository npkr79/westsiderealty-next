# 🎯 Cursor Prompt for Favicon Updates

Use this optimized prompt when you need to update your website's favicon using Cursor AI:

## 📝 Prompt Template

```
Update the website favicon with the attached image file. Please:

1. Replace the existing favicon files in the /public directory
2. Generate multiple favicon formats and sizes:
   - favicon.ico (traditional format)
   - favicon.svg (vector format) 
   - PNG files in sizes: 16x16, 32x32, 96x96, 192x192, 512x512
   - Apple Touch Icons for iOS devices
   - Android Chrome Icons for PWA support
3. Update the Next.js metadata configuration in src/app/layout.tsx
4. Create/update the web app manifest (site.webmanifest)
5. Ensure proper browser compatibility and PWA support
6. Test that the favicon displays correctly across different browsers

The attached image should be used as the source for generating all favicon variants. Please maintain the brand colors and ensure good visibility at small sizes.
```

## 🔧 Advanced Prompt (with specific requirements)

```
Update the website favicon system with the attached image. Requirements:

**Technical Specifications:**
- Generate favicon.ico with embedded sizes: 16x16, 32x32, 48x48
- Create favicon.svg for modern browsers with proper scaling
- Generate PNG variants: 16x16, 32x32, 96x96, 192x192, 256x256, 512x512
- Create Apple Touch Icons: 57x57, 60x60, 72x72, 76x76, 114x114, 120x120, 144x144, 152x152, 180x180
- Generate Android Chrome Icons: 192x192, 512x512
- Update web app manifest with proper icon declarations
- Create browserconfig.xml for Windows tile support

**Code Updates:**
- Update src/app/layout.tsx metadata with comprehensive icon configuration
- Ensure proper Next.js 14+ metadata format
- Include theme-color and msapplication settings
- Add manifest link and PWA support

**Brand Guidelines:**
- Primary color: #1a365d (RE/MAX blue)
- Background: White or transparent
- Ensure visibility at 16x16 pixel size
- Maintain brand consistency across all sizes

**Testing Requirements:**
- Verify favicon displays in browser tabs
- Test bookmark icons
- Check mobile home screen icons (iOS/Android)
- Validate PWA installation icons
- Ensure proper fallbacks for older browsers

Please also create documentation explaining how to update favicons in the future.
```

## 🎨 Brand-Specific Prompt

```
Update the RE/MAX Westside Realty website favicon with the attached logo image:

**Brand Requirements:**
- Use RE/MAX brand colors: Primary #1a365d, Secondary #0066cc
- Include house/real estate iconography if possible
- Ensure "Westside Realty" brand recognition
- Maintain professional appearance at all sizes

**Technical Implementation:**
- Replace all existing favicon files in /public/
- Update Next.js metadata in src/app/layout.tsx
- Generate complete favicon suite (ICO, PNG, SVG, Apple Touch, Android)
- Create web app manifest for PWA support
- Add Windows tile configuration

**Quality Standards:**
- Source image optimization for web
- Proper compression for fast loading
- Accessibility considerations (contrast, visibility)
- Cross-browser compatibility testing

The favicon should represent our premium real estate brand while being technically optimized for modern web standards.
```

## 🚀 Quick Update Prompt

```
Replace website favicon with attached image. Generate all standard formats (ICO, PNG, SVG), update Next.js metadata, and ensure mobile/PWA compatibility. Use existing favicon system structure.
```

## 📋 Prompt Enhancement Tips

1. **Be Specific**: Mention exact file formats and sizes needed
2. **Include Context**: Reference existing favicon system if present
3. **Brand Guidelines**: Specify colors, style, and brand requirements
4. **Technical Requirements**: Mention framework (Next.js, React, etc.)
5. **Testing Needs**: Request verification across browsers/devices
6. **Documentation**: Ask for update instructions for future use

## 🔍 What to Attach

- **Source Image**: High-resolution PNG or SVG (512x512px minimum)
- **Brand Guidelines**: If specific colors/styles required
- **Reference Images**: Examples of desired favicon appearance

## ✅ Expected Deliverables

When using these prompts, expect:
- Complete favicon file suite
- Updated metadata configuration
- Web app manifest
- Browser compatibility files
- Testing verification
- Documentation for future updates

---

*Use these prompts to ensure consistent, professional favicon updates with comprehensive browser and device support.*