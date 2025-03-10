import React from 'react'
import {TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View} from 'react-native'
import {cn} from '../utils/cn'
import {useTheme} from '../theme/ThemeProvider'

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = ({
	variant = 'default',
	size = 'default',
	isLoading = false,
	leftIcon,
	rightIcon,
	children,
	className,
	disabled,
	style,
	...props
}: ButtonProps) => {
	const {theme} = useTheme()

	// Base styles - matching web component
	const baseStyles = 'items-center justify-center rounded-md'

	// Variant styles - matching web component
	const variantStyles = {
		default: 'border border-primary bg-primary/10 text-primary',
		destructive: 'bg-destructive text-destructive-foreground',
		outline: 'border border-input bg-background',
		secondary: 'bg-secondary text-secondary-foreground',
		ghost: 'bg-transparent',
		link: 'text-primary'
	}

	// Size styles - matching web component
	const sizeStyles = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 px-3',
		lg: 'h-11 px-8',
		icon: 'h-10 w-10'
	}

	// Text styles
	const textBaseStyles = 'text-sm font-medium text-center'
	const textVariantStyles = {
		default: 'text-primary',
		destructive: 'text-destructive-foreground',
		outline: 'text-foreground',
		secondary: 'text-secondary-foreground',
		ghost: 'text-foreground',
		link: 'text-primary underline'
	}

	// Get spinner color based on variant
	const getSpinnerColor = () => {
		switch (variant) {
		case 'default':
		case 'link':
			return theme.primary
		case 'destructive':
			return theme.destructiveForeground
		default:
			return theme.foreground
		}
	}

	// Critical inline styles to ensure proper layout
	const buttonStyle = {
		flexDirection: 'row' as const,
		...style as any
	}

	return (
		<TouchableOpacity
			className={cn(
				baseStyles,
				variantStyles[variant],
				sizeStyles[size],
				disabled || isLoading ? 'opacity-50' : '',
				className
			)}
			style={buttonStyle}
			disabled={disabled || isLoading}
			activeOpacity={0.8}
			{...props}
		>
			{isLoading && (
				<View className="mr-4 w-2 h-2">
					<ActivityIndicator
						size="small"
						color={getSpinnerColor()}
						className="w-full h-full"
					/>
				</View>
			)}

			{!isLoading && leftIcon && (
				<View className="mr-2">
					{leftIcon}
				</View>
			)}

			<Text
				className={cn(
					textBaseStyles,
					textVariantStyles[variant]
				)}
			>
				{children}
			</Text>

			{!isLoading && rightIcon && (
				<View className="ml-2">
					{rightIcon}
				</View>
			)}
		</TouchableOpacity>
	)
}
