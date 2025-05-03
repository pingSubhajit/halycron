import React from 'react'
import {ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps, View} from 'react-native'
import {utils} from '@/lib/utils'
import {useTheme} from '@/src/theme/ThemeProvider'

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
	textClassName?: string;
}

export const Button = ({
	variant = 'default',
	size = 'default',
	isLoading = false,
	leftIcon,
	rightIcon,
	children,
	className,
	textClassName,
	disabled,
	style,
	...props
}: ButtonProps) => {
	const {theme} = useTheme()

	// Base styles - matching web component
	const baseStyles = 'items-center justify-center rounded-md gap-2'

	// Variant styles - matching web component
	const variantStyles = {
		default: 'border border-primary bg-primary/10 text-primary',
		destructive: 'bg-destructive text-destructive-foreground',
		outline: 'border border-input bg-transparent text-foreground',
		secondary: 'bg-secondary text-secondary-foreground',
		ghost: 'bg-transparent',
		link: 'text-primary'
	}

	// Size styles - matching web component
	const sizeStyles = {
		default: 'h-11 px-4 py-2',
		sm: 'h-10 px-3',
		lg: 'h-12 px-8',
		icon: 'h-10 w-10'
	}

	// Text styles
	const textBaseStyles = 'text-base font-medium text-center'
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
			className={utils(
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
				<View className="mr-4 w-1 h-1">
					<ActivityIndicator
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
				className={utils(
					textBaseStyles,
					textVariantStyles[variant],
					textClassName
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
