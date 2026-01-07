# Image Component Refactoring Guide

## Overview
This guide helps you replace existing `<Image />` components with `<ImageWithFallback />` to automatically handle missing or failed image loads with the agency logo fallback.

## New Component: `ImageWithFallback`

**Location:** `src/components/common/ImageWithFallback.tsx`

**Features:**
- ✅ Accepts all Next.js Image props
- ✅ Automatic fallback to agency logo (`/company-logo.png`)
- ✅ Handles null/undefined src values
- ✅ Handles 404/image load errors
- ✅ Prevents infinite loop if fallback also fails

**Default Fallback:** `/company-logo.png` (agency logo in public folder)

## Usage Examples

### Basic Usage
```tsx
import ImageWithFallback from "@/components/common/ImageWithFallback";

<ImageWithFallback 
  src={project.imageUrl} 
  alt={project.title} 
  width={400} 
  height={300} 
/>
```

### With Custom Fallback
```tsx
<ImageWithFallback 
  src={heroImage} 
  alt="Hero banner"
  fallbackSrc="/custom-fallback.png"
  width={1920}
  height={600}
  priority
/>
```

### With Fill Layout
```tsx
<ImageWithFallback 
  src={projectImage}
  alt={project.name}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, 50vw"
/>
```

## Finding and Replacing Image Components

### Option 1: Using VS Code / Cursor Search

1. **Search for Next.js Image imports:**
   ```
   from "next/image"
   ```

2. **Search for Image component usage:**
   ```
   <Image
   ```

3. **Search for img tags (if any):**
   ```
   <img
   ```

### Option 2: Using Terminal (grep)

```bash
# Find all files using Next.js Image
grep -r "from \"next/image\"" src/components/

# Find all Image component usages
grep -r "<Image" src/components/ --include="*.tsx" --include="*.ts"

# Find img tags
grep -r "<img" src/components/ --include="*.tsx" --include="*.ts"
```

### Option 3: Manual Refactoring Steps

1. **Update imports:**
   ```tsx
   // Before
   import Image from "next/image";
   
   // After
   import ImageWithFallback from "@/components/common/ImageWithFallback";
   ```

2. **Replace component:**
   ```tsx
   // Before
   <Image src={imageUrl} alt="Description" width={400} height={300} />
   
   // After
   <ImageWithFallback src={imageUrl} alt="Description" width={400} height={300} />
   ```

3. **Remove manual error handling (if present):**
   ```tsx
   // Before
   {imageUrl ? (
     <Image src={imageUrl} alt="..." onError={handleError} />
   ) : (
     <div>No image</div>
   )}
   
   // After
   <ImageWithFallback src={imageUrl} alt="..." />
   ```

## Priority Files to Refactor

Based on codebase analysis, prioritize these files:

1. **Project/Property Cards:**
   - `src/components/properties/ProjectCard.tsx`
   - `src/components/properties/PropertyCard.tsx`
   - `src/components/properties/GoaPropertyCard.tsx`
   - `src/components/home/TrendingProjectsSlider.tsx`

2. **Hero/Gallery Images:**
   - `src/components/home/HeroBannerSlider.tsx`
   - `src/components/project-details/ProjectHeroGallery.tsx`
   - `src/components/property/PropertyImageGallery.tsx`

3. **City/Service Cards:**
   - `src/components/home/CityCardsSection.tsx`
   - `src/components/home/ServicesSection.tsx`

## Testing Checklist

After refactoring, verify:

- [ ] Images load correctly when src is valid
- [ ] Fallback logo appears when src is null/undefined
- [ ] Fallback logo appears when image URL returns 404
- [ ] No console errors about missing images
- [ ] No infinite loops or re-render issues
- [ ] Images maintain aspect ratios and styling
- [ ] Performance is not degraded (images still optimized)

## Notes

- The default fallback is `/company-logo.png` in the public folder
- You can override with `fallbackSrc` prop for specific use cases
- Component handles all Next.js Image optimizations automatically
- No breaking changes: accepts all standard Image props
