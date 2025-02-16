/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@halycon/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
