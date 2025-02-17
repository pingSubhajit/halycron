/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['@halycon/ui'],
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'cdn.discordapp.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'halycon-photos.s3.ap-south-1.amazonaws.com',
				pathname: '/**'
			}
		]
	},
	experimental: {
		reactCompiler: true
	}
}

export default nextConfig
