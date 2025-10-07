/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['via.placeholder.com', 'picsum.photos'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rlukmyaomplzkobifmxy.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Optimizations for production
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig