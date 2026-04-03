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
  },
  async redirects() {
    return [
      {
        source: "/creator-fellowship-cohort-1",
        destination: "/creator-fellowship/cohort-1",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
