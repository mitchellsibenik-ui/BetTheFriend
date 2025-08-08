/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disable TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint errors during build
    ignoreDuringBuilds: true,
  },
  // Force dynamic rendering for all pages
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['prisma']
  }
}

module.exports = nextConfig 