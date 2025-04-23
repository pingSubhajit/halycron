import React from 'react'
import {Stack} from 'expo-router'
import {ThemeProvider} from '../src/theme/ThemeProvider'

const AppLayout = () => {
	return (
		<ThemeProvider>
			<Stack
				screenOptions={{
					headerShown: false // Hides the header for all screens
				}}
			/>
		</ThemeProvider>
	)
}

export default AppLayout
