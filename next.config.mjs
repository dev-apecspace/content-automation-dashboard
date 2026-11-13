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
  // [server-action-csrf] Deploy stack: browser -> platform edge -> Caddy:81 -> next:3000.
  // The edge rewrites the Host header, so Server Action POSTs fail the built-in
  // Origin/host check with "Invalid Server Actions request." (E80) -> sidebar
  // loses all menu items and the user block falls back to generic "User".
  // Allow the deploy wildcard domains; the Origin host (no protocol) is matched
  // against these with subdomain-wildcard support (isCsrfOriginAllowed).
  experimental: {
    serverActions: {
      allowedOrigins: ["*.space-z.ai", "localhost", "127.0.0.1"],
    },
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
