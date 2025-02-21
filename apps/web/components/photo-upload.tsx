import {useCallback, useState} from 'react'
import {Upload} from 'lucide-react'
import {useDropzone} from 'react-dropzone'
import {cn} from '@halycon/ui/lib/utils'
import {encryptFile, generateEncryptionKey} from '@/lib/utils'
import {getPreSignedUploadUrl, savePhotoToDB, uploadEncryptedPhoto} from '@/lib/photos'

interface UploadState {
    progress: number;
    status: 'idle' | 'uploading' | 'encrypting' | 'success' | 'error';
    error?: string;
}

const getImageDimensions = (file: File): Promise<{width: number; height: number}> => {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => {
			resolve({width: img.width, height: img.height})
		}
		img.onerror = reject
		img.src = URL.createObjectURL(file)
	})
}

export const PhotoUpload = () => {
	const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})

	const uploadFile = async (file: File) => {
		try {
			// Get image dimensions
			const dimensions = await getImageDimensions(file)

			// Generate a secure random encryption key
			const encryptionKey = generateEncryptionKey()

			// Update state to encrypting
			setUploadStates(prev => ({
				...prev,
				[file.name]: {progress: 0, status: 'encrypting'}
			}))

			// Encrypt the file
			const {encryptedFile, iv, key} = await encryptFile(file, encryptionKey)

			// Get pre-signed URL
			const {uploadUrl, fileKey} = await getPreSignedUploadUrl(file.name, file.type)

			// Update state to uploading
			setUploadStates(prev => ({
				...prev,
				[file.name]: {progress: 0, status: 'uploading'}
			}))

			// Upload encrypted file
			await uploadEncryptedPhoto(encryptedFile, uploadUrl)

			// Save encryption details to database
			await savePhotoToDB(
				fileKey,
				key,
				iv,
				file.name,
				file.type,
				dimensions.width,
				dimensions.height
			)

			// Update state to success
			setUploadStates(prev => ({
				...prev,
				[file.name]: {progress: 100, status: 'success'}
			}))
		} catch (error) {
			setUploadStates(prev => ({
				...prev,
				[file.name]: {
					progress: 0,
					status: 'error',
					error: error instanceof Error ? error.message : 'Upload failed'
				}
			}))
		}
	}

	const onDrop = useCallback((acceptedFiles: File[]) => {
		acceptedFiles.forEach(file => {
			setUploadStates(prev => ({
				...prev,
				[file.name]: {progress: 0, status: 'idle'}
			}))
			uploadFile(file)
		})
	}, [])

	const {getRootProps, getInputProps, isDragActive} = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.raw']
		},
		maxSize: 50 * 1024 * 1024 // 50MB
	})

	return (
		<div className="w-full">
			{/* Upload Progress */}
			{Object.entries(uploadStates).length > 0 && <div className="h-[200px] flex flex-col-reverse overflow-y-auto gap-2">
				{Object.entries(uploadStates).map(([fileName, state]) => (
					<div
						key={fileName}
						className={cn(
							'w-full text-sm flex items-center justify-between gap-2 px-2 py-1 bg-accent rounded-sm',
							state.status !== 'success' && state.status !== 'error' && 'animate-pulse'
						)}
					>
						<p className="truncate opacity-80">{fileName}</p>

						<div className={cn(
							'text-yellow-300 flex items-center gap-1',
							state.status === 'success' && 'text-green-500',
							state.status === 'error' && 'text-red-500'
						)}>
							<span>{state.status}</span>
						</div>
					</div>
				))}
			</div>}

			<div
				{...getRootProps()}
				className={`mt-4 border-2 border-dashed p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
			>
				<input {...getInputProps()} />
				<Upload className="mx-auto h-12 w-12 text-gray-400" />
				<p className="mt-2 text-sm text-gray-600">
					{isDragActive
						? 'Drop the files here...'
						: 'Drag \'n\' drop some files here, or click to select files'}
				</p>
				<p className="text-xs text-gray-500 mt-1">
					Supported formats: JPG, JPEG, PNG, HEIC, RAW (Max: 50MB)
				</p>
			</div>
		</div>
	)
}
