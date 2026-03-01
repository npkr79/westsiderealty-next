import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    // Temporary: allow production deploy while legacy route typing is stabilized.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imqlfztriragzypplbqa.supabase.co',
        // Allow ALL Supabase Storage buckets (landing-pages, banner-images, etc.)
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
