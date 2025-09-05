/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'http://192.168.18.10:5000',
    NEXT_PUBLIC_SOCKET_URL: 'http://192.168.18.10:5000',
    NEXT_PUBLIC_NETWORK_IP: '192.168.18.10'
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.30.21:5000/api/:path*', // Proxy to backend
      },
    ];
  },
}

module.exports = nextConfig
