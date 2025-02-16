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
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
