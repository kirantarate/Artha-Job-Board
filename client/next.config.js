/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack (use stable Webpack instead)
  // Turbopack in Next.js 16 has known stability issues
  // Note: `experimental.turbo` is unrecognized in this Next.js version and
  // causes warnings/errors. If you need to opt out of Turbopack, do so by
  // using the supported flags or running with the webpack dev server.
  // experimental: { turbo: false }, // removed because it's not supported
}

module.exports = nextConfig
