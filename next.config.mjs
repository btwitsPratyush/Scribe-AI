/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force use of SWC WASM to avoid code signature issues on macOS
  swcMinify: true,
  experimental: {
    // Use WASM version of SWC
    swcTraceProfiling: false,
  },
}

export default nextConfig
