import EXIF from 'exif-js'
import piexif from 'piexifjs'

export interface PrivacySettings {
	stripLocationData: boolean
	anonymizeTimestamps: boolean
}

/**
 * Convert ArrayBuffer to base64 safely using FileReader
 */
const arrayBufferToBase64 = (arrayBuffer: ArrayBuffer): Promise<string> => {
	return new Promise((resolve, reject) => {
		const blob = new Blob([arrayBuffer])
		const reader = new FileReader()
		reader.onload = () => {
			const dataUrl = reader.result as string
			const base64 = dataUrl.split(',')[1]
			if (base64) {
				resolve(base64)
			} else {
				reject(new Error('Failed to convert to base64'))
			}
		}
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}

/**
 * Process a photo file according to privacy settings
 */
export const processPhotoForPrivacy = async (
	file: File,
	privacySettings: PrivacySettings
): Promise<File> => {
	// If no privacy settings are enabled, return the original file
	if (!privacySettings.stripLocationData && !privacySettings.anonymizeTimestamps) {
		return file
	}

	// Only process image files that might contain EXIF data
	if (!file.type.startsWith('image/')) {
		return file
	}

	// Skip processing for formats that typically don't contain EXIF
	const skipFormats = ['image/gif', 'image/bmp', 'image/svg+xml']
	if (skipFormats.includes(file.type)) {
		return file
	}

	try {
		// Convert a file to ArrayBuffer for processing
		const arrayBuffer = await file.arrayBuffer()

		// Check if it's a JPEG (most common format with EXIF)
		if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
			return await processJpegExif(file, arrayBuffer, privacySettings)
		}

		// For other formats (PNG, HEIC, etc.), try to process or return original
		return await processOtherImageFormats(file, arrayBuffer, privacySettings)

	} catch (error) {
		console.warn('Failed to process photo privacy settings:', error)
		// Return original file if processing fails
		return file
	}
}

/**
 * Process JPEG files with EXIF data
 */
const processJpegExif = async (
	originalFile: File,
	arrayBuffer: ArrayBuffer,
	privacySettings: PrivacySettings
): Promise<File> => {
	try {
		// Convert ArrayBuffer to base64 for piexifjs
		const base64 = await arrayBufferToBase64(arrayBuffer)
		const dataUrl = `data:${originalFile.type};base64,${base64}`

		// Extract existing EXIF data
		const exifData = piexif.load(dataUrl)

		// Process privacy settings
		if (privacySettings.stripLocationData) {
			// Remove GPS data
			delete exifData['GPS']

			// Remove specific location-related tags from EXIF
			if (exifData['0th']) {
				// Remove GPS info reference (using string key to avoid type issues)
				delete exifData['0th'][34853] // GPS Info tag
			}
		}

		if (privacySettings.anonymizeTimestamps) {
			// Anonymize timestamps by setting them to a generic date
			const anonymizedDate = '2000:01:01 00:00:00'

			if (exifData['0th']) {
				exifData['0th'][piexif.ImageIFD.DateTime] = anonymizedDate
			}
			if (exifData['Exif']) {
				exifData['Exif'][piexif.ExifIFD.DateTimeOriginal] = anonymizedDate
				exifData['Exif'][piexif.ExifIFD.DateTimeDigitized] = anonymizedDate
			}
		}

		// Generate new EXIF binary
		const exifBytes = piexif.dump(exifData)

		// Insert modified EXIF back into image
		const newDataUrl = piexif.insert(exifBytes, dataUrl)

		// Convert back to File
		const response = await fetch(newDataUrl)
		const blob = await response.blob()

		return new File([blob], originalFile.name, {
			type: originalFile.type,
			lastModified: originalFile.lastModified
		})

	} catch (error) {
		console.warn('Failed to process JPEG EXIF data:', error)
		return originalFile
	}
}

/**
 * Process other image formats
 */
const processOtherImageFormats = async (
	originalFile: File,
	arrayBuffer: ArrayBuffer,
	privacySettings: PrivacySettings
): Promise<File> => {
	/*
	 * For non-JPEG formats, we have limited EXIF editing capabilities
	 * For now, return the original file
	 * TODO: Add support for other formats if needed
	 */
	return originalFile
}

/**
 * Extract basic EXIF info for debugging/logging purposes
 */
export const extractBasicExifInfo = (file: File): Promise<any> => {
	return new Promise((resolve) => {
		EXIF.getData(file as any, function (this: any) {
			const data = {
				hasGPS: !!EXIF.getTag(this, 'GPSLatitude'),
				dateTime: EXIF.getTag(this, 'DateTime'),
				dateTimeOriginal: EXIF.getTag(this, 'DateTimeOriginal'),
				camera: (EXIF.getTag(this, 'Make') || '') + ' ' + (EXIF.getTag(this, 'Model') || '')
			}
			resolve(data)
		})
	})
}
