import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imqlfztriragzypplbqa.supabase.co',
        // Allow ALL Supabase Storage buckets (landing-pages, banner-images, etc.)
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default nextConfig
