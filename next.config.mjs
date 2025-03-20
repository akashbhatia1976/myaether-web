/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: false, // ✅ Forces Next.js to use `/pages/` instead of `/app/`
  },
};

export default nextConfig;

