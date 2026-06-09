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
}

export default nextConfig
