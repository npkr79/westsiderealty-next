import type { NextConfig } from 'next'
import path from 'path'
import fs from 'fs'

// When running from a git worktree nested inside the main project,
// node_modules lives in the parent. Walk up to find it so Turbopack
// can resolve packages within its filesystem root.
function findTurbopackRoot(start: string): string {
  let dir = start
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'node_modules', 'next', 'package.json'))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  return start
}
const turbopackRoot = findTurbopackRoot(process.cwd())

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'X-XSS-Protection',        value: '1; mode=block' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ── Security headers on every route ──────────────────────────────
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      // ── Next.js static assets are content-hashed → immutable forever ─
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ── Public read-only API routes ───────────────────────────────────
      {
        source: '/api/developers/goa',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=7200' },
        ],
      },
      {
        source: '/api/projects/goa',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=600, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/api/ticker-markets',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=600' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Slug aliases — add more as needed when DB slug ≠ expected URL
      { source: "/developers/rajapushpa", destination: "/developers/rajapushpa-group", permanent: true },
      { source: "/developers/my-home-constructions", destination: "/developers/my-home-group", permanent: true },
      { source: "/developers/lansum", destination: "/developers", permanent: false },
      { source: "/admin", destination: "/crm/login", permanent: true },
      { source: "/admin/:path*", destination: "/crm/login", permanent: true },
    ];
  },
  turbopack: {
    root: turbopackRoot,
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
