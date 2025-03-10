// Theme variables adapted from packages/ui/src/styles/globals.css
export const lightTheme = {
	dark: 'hsl(0, 0%, 7%)',
	background: 'hsl(169, 0%, 95%)',
	foreground: 'hsl(169, 0%, 7%)',
	card: 'hsl(169, 0%, 90%)',
	cardForeground: 'hsl(169, 0%, 10%)',
	popover: 'hsl(169, 0%, 95%)',
	popoverForeground: 'hsl(169, 95%, 7%)',
	primary: 'hsl(169, 100%, 50%)',
	primaryForeground: 'hsl(0, 0%, 100%)',
	secondary: 'hsl(169, 10%, 70%)',
	secondaryForeground: 'hsl(0, 0%, 0%)',
	muted: 'hsl(131, 10%, 85%)',
	mutedForeground: 'hsl(169, 0%, 35%)',
	accent: 'hsl(131, 10%, 80%)',
	accentForeground: 'hsl(169, 0%, 10%)',
	destructive: 'hsl(0, 50%, 30%)',
	destructiveForeground: 'hsl(169, 0%, 90%)',
	border: 'hsl(169, 20%, 50%)',
	input: 'hsl(169, 20%, 18%)',
	ring: 'hsl(169, 100%, 50%)'
}

export const darkTheme = {
	dark: 'hsl(0, 0%, 7%)',
	background: 'hsl(169, 10%, 7%)',
	foreground: 'hsl(169, 0%, 90%)',
	card: 'hsl(169, 0%, 7%)',
	cardForeground: 'hsl(169, 0%, 90%)',
	popover: 'hsl(169, 10%, 5%)',
	popoverForeground: 'hsl(169, 0%, 90%)',
	primary: 'hsl(169, 100%, 50%)',
	primaryForeground: 'hsl(0, 0%, 100%)',
	secondary: 'hsl(169, 10%, 10%)',
	secondaryForeground: 'hsl(0, 0%, 100%)',
	muted: 'hsl(131, 10%, 15%)',
	mutedForeground: 'hsl(169, 0%, 60%)',
	accent: 'hsl(131, 10%, 15%)',
	accentForeground: 'hsl(169, 0%, 90%)',
	destructive: 'hsl(0, 50%, 30%)',
	destructiveForeground: 'hsl(169, 0%, 90%)',
	border: 'hsl(169, 20%, 18%)',
	input: 'hsl(169, 20%, 18%)',
	ring: 'hsl(169, 100%, 50%)'
}

// Convert HSL to hex for React Native
export function hslToHex(h: number, s: number, l: number): string {
	s /= 100
	l /= 100

	const c = (1 - Math.abs(2 * l - 1)) * s
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
	const m = l - c / 2
	let r = 0, g = 0, b = 0

	if (0 <= h && h < 60) {
		r = c; g = x; b = 0
	} else if (60 <= h && h < 120) {
		r = x; g = c; b = 0
	} else if (120 <= h && h < 180) {
		r = 0; g = c; b = x
	} else if (180 <= h && h < 240) {
		r = 0; g = x; b = c
	} else if (240 <= h && h < 300) {
		r = x; g = 0; b = c
	} else if (300 <= h && h < 360) {
		r = c; g = 0; b = x
	}

	r = Math.round((r + m) * 255)
	g = Math.round((g + m) * 255)
	b = Math.round((b + m) * 255)

	const rHex = r.toString(16).padStart(2, '0')
	const gHex = g.toString(16).padStart(2, '0')
	const bHex = b.toString(16).padStart(2, '0')

	return `#${rHex}${gHex}${bHex}`
}
