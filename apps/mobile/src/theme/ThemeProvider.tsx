import React, {createContext, useContext, useState} from 'react'
import {darkTheme, lightTheme} from '@/src/theme/theme'
import {colorScheme, useColorScheme} from 'nativewind'

type ThemeContextType = {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

colorScheme.set('dark')

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
	const {colorScheme, toggleColorScheme} = useColorScheme()
	const [isDark, setIsDark] = useState(true)

	const theme = isDark ? darkTheme : lightTheme

	return (
		<ThemeContext.Provider value={{theme, isDark, toggleTheme: toggleColorScheme}}>
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
