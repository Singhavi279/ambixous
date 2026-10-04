/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/dms/image/**",
      },
    ],
  },
  async redirects() {
    return [
      // Force the canonical host: www.ambixous.in -> ambixous.in
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.ambixous.in" }],
        destination: "https://ambixous.in/:path*",
        permanent: true,
      },
      {
        source: "/creator-fellowship-cohort-1",
        destination: "/creator-fellowship/cohort-1",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/pdfstudio",
        destination: "/pdfstudio/index.html",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/pdfstudio/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig
