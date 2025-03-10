import React, {createContext, useContext, useState, useEffect} from 'react'
import {useColorScheme} from 'react-native'
import {lightTheme, darkTheme} from './theme'

type ThemeContextType = {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
	const colorScheme = useColorScheme()
	const [isDark, setIsDark] = useState(colorScheme === 'dark')

	// Update theme when system theme changes
	useEffect(() => {
		setIsDark(colorScheme === 'dark')
	}, [colorScheme])

	const theme = isDark ? darkTheme : lightTheme

	const toggleTheme = () => {
		setIsDark(!isDark)
	}

	return (
		<ThemeContext.Provider value={{theme, isDark, toggleTheme}}>
			{children}
		</ThemeContext.Provider>
	)
}

export const useTheme = () => {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}
