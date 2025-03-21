/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0', // Disable caching for all routes
          },
        ],
      },
      {
        // Optionally, you can add specific caching rules for static assets
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache static assets aggressively
          },
        ],
      },
    ];
  },
};

export default nextConfig;
