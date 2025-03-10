import React from 'react'
import {Stack} from 'expo-router'
import {ThemeProvider} from '../src/theme/ThemeProvider'

const AppLayout = () => {
	return (
		<ThemeProvider>
			<Stack />
		</ThemeProvider>
	)
}

export default AppLayout
