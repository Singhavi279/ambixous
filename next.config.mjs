/** @type {import('next').NextConfig} */
const nextConfig = {
  // Invoxa's API (Express + PDFKit) reads its own data files, so keep these out of the bundle.
  serverExternalPackages: ["express", "pdfkit", "@libsql/client", "nodemailer"],
  outputFileTracingIncludes: {
    "/invoxa/api/[[...path]]": ["./node_modules/@fontsource/noto-sans/files/*.woff", "./node_modules/pdfkit/js/**/*"],
  },
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
      {
        source: "/invoxa",
        destination: "/invoxa/index.html",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/invoxa/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
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
