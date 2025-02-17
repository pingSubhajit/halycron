import {useCallback, useState} from 'react'
import {Upload} from 'lucide-react'
import {useDropzone} from 'react-dropzone'
import CryptoJS from 'crypto-js'
import {cn} from '@halycon/ui/lib/utils'

interface UploadState {
    progress: number;
    status: 'idle' | 'uploading' | 'encrypting' | 'success' | 'error';
    error?: string;
}

export const PhotoUpload = () => {
	const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})

	const encryptFile = async (file: File, encryptionKey: string) => {
		const arrayBuffer = await file.arrayBuffer()
		const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
		const iv = CryptoJS.lib.WordArray.random(16)

		const encrypted = CryptoJS.AES.encrypt(wordArray, encryptionKey, {
			iv: iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.NoPadding
		})

		const encryptedFile = new Blob([encrypted.ciphertext.toString()], {
			type: file.type
		})

		return {
			encryptedFile: new File([encryptedFile], file.name, {type: file.type}),
			iv: iv.toString(),
			key: encryptionKey
		}
	}

	const uploadFile = async (file: File) => {
		try {
			// Generate a random encryption key
			const encryptionKey = CryptoJS.lib.WordArray.random(32).toString()

			// Update state to encrypting
			setUploadStates(prev => ({
				...prev,
				[file.name]: {progress: 0, status: 'encrypting'}
			}))

			// Encrypt the file
			const {encryptedFile, iv, key} = await encryptFile(file, encryptionKey)

			// Get presigned URL
			const response = await fetch('/api/photos/upload-url', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fileName: file.name,
					contentType: file.type
				})
			})

			if (!response.ok) {
				throw new Error('Failed to get upload URL')
			}

			const {uploadUrl, fileKey} = await response.json()

			// Update state to uploading
			setUploadStates(prev => ({
				...prev,
				[file.name]: {progress: 0, status: 'uploading'}
			}))

			// Upload encrypted file
			const uploadResponse = await fetch(uploadUrl, {
				method: 'PUT',
				body: encryptedFile,
				headers: {
					'Content-Type': file.type,
					'x-amz-server-side-encryption': 'AES256'
				}
			})

			if (!uploadResponse.ok) {
				throw new Error('Upload failed')
			}

			// Save encryption details to database (you'll need to implement this endpoint)
			await fetch('/api/photos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fileKey,
					encryptedKey: key,
					keyIv: iv,
					originalFilename: file.name,
					fileSize: file.size,
					mimeType: file.type
				})
			})

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
			<div className="h-[200px] flex flex-col-reverse overflow-y-scroll gap-2">
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
							{/* {state.status === 'success' && <span className="w-1 h-1 bg-green-500 rounded-full" />}*/}
							<span>{state.status}</span>
						</div>
					</div>
				))}
			</div>

			<div
				{...getRootProps()}
				className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
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
