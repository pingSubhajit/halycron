import baseConfig from '@halycron/ui/tailwind.config'

/** @type {import('tailwindcss').Config} */
const config = {
	content: [
		'./app/**/*.{js,jsx,ts,tsx}',
		'../../packages/ui/src/**/*.{js,jsx,ts,tsx}'
	],
	presets: [require('nativewind/preset')],
	theme: {
		...baseConfig.theme
	},
	plugins: [...(baseConfig.plugins || [])]
}

export default config
