/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack (use stable Webpack instead)
  // Turbopack in Next.js 16 has known stability issues
  experimental: {
    turbo: false,
  },
}

module.exports = nextConfig
