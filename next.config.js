/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['pdf-parse'],
  async redirects() {
    if (!process.env.VERCEL) return []
    return [
      {
        source: '/:path*',
        destination: 'https://dontgetcaught-production.up.railway.app/:path*',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
