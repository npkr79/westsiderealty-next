#!/bin/bash
# Script to find all Image component usages for refactoring

echo "🔍 Finding Next.js Image imports..."
echo "================================"
grep -rn "from [\"']next/image[\"']" src/components/ --include="*.tsx" --include="*.ts" | head -20

echo ""
echo "🔍 Finding Image component usages..."
echo "================================"
grep -rn "<Image" src/components/ --include="*.tsx" --include="*.ts" | head -30

echo ""
echo "🔍 Finding img tags..."
echo "================================"
grep -rn "<img" src/components/ --include="*.tsx" --include="*.ts" | head -10

echo ""
echo "✅ Search complete!"
echo ""
echo "To replace manually:"
echo "1. Change import: import Image from 'next/image' → import ImageWithFallback from '@/components/common/ImageWithFallback'"
echo "2. Change component: <Image → <ImageWithFallback"
echo "3. Keep all props the same - ImageWithFallback accepts all Next.js Image props"
