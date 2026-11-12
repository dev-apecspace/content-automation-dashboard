/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by the deployment pipeline (.zscripts/build.sh expects
  // .next/standalone/server.js). Do not remove.
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep sandbox workspace extras (assistant tooling, uploads, test artifacts)
  // out of the standalone deploy bundle.
  outputFileTracingExcludes: {
    "*": [
      "./skills/**/*",
      "./.zscripts/**/*",
      "./download/**/*",
      "./upload/**/*",
    ],
  },
}

export default nextConfig
