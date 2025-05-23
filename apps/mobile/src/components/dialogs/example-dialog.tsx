import React from 'react'
import {Dimensions, Modal, Text, TouchableOpacity, View} from 'react-native'

interface ExampleDialogProps {
	isOpen: boolean
	onClose: () => void
}

const ExampleDialog: React.FC<ExampleDialogProps> = ({isOpen, onClose}) => {
	return (
		<Modal
			visible={isOpen}
			transparent={true}
			animationType="slide"
			onRequestClose={onClose}
		>
			{/* Backdrop */}
			<TouchableOpacity
				style={{
					flex: 1,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					justifyContent: 'center',
					alignItems: 'center'
				}}
				activeOpacity={1}
				onPress={onClose}
			>
				{/* Dialog Container */}
				<TouchableOpacity
					style={{
						backgroundColor: 'white',
						borderRadius: 12,
						padding: 24,
						margin: 20,
						maxWidth: Dimensions.get('window').width - 40,
						shadowColor: '#000',
						shadowOffset: {
							width: 0,
							height: 2
						},
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
						elevation: 5
					}}
					activeOpacity={1}
				>
					{/* Dialog Content */}
					<View>
						<Text
							style={{
								fontSize: 18,
								fontWeight: 'bold',
								marginBottom: 12,
								color: '#1a1a1a'
							}}
						>
							Example Dialog
						</Text>

						<Text
							style={{
								fontSize: 14,
								color: '#666',
								marginBottom: 20,
								lineHeight: 20
							}}
						>
							This is an example dialog that demonstrates the global dialog system.
							You can trigger this dialog from anywhere in your app using the useExampleDialog hook.
						</Text>

						{/* Action Buttons */}
						<View
							style={{
								flexDirection: 'row',
								justifyContent: 'flex-end',
								gap: 12
							}}
						>
							<TouchableOpacity
								onPress={onClose}
								style={{
									paddingHorizontal: 16,
									paddingVertical: 8,
									borderRadius: 6,
									backgroundColor: '#f0f0f0'
								}}
							>
								<Text
									style={{
										color: '#666',
										fontWeight: '500'
									}}
								>
									Cancel
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => {
									// Handle confirm action here
									console.log('Dialog confirmed!')
									onClose()
								}}
								style={{
									paddingHorizontal: 16,
									paddingVertical: 8,
									borderRadius: 6,
									backgroundColor: '#007AFF'
								}}
							>
								<Text
									style={{
										color: 'white',
										fontWeight: '500'
									}}
								>
									Confirm
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	)
}

export default ExampleDialog
