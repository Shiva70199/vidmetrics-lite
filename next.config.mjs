/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Isolate dev artifacts from production build artifacts to prevent
  // stale/mixed chunk resolution crashes on Windows.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // App Router is enabled by default in Next.js 14+
  webpack: (config, { dev }) => {
    // Windows can intermittently fail Webpack pack cache renames (ENOENT),
    // which shows up as noisy warnings during development.
    if (dev) {
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;
