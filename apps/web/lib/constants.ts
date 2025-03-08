export const ACCEPTED_IMAGE_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic', '.heif'],
  'image/avif': ['.avif'],
  'image/avis': ['.avif'],  // Some systems use this MIME type
  'application/octet-stream': ['.avif'], // Fallback for some systems
  'image/webp': ['.webp'],
  'image/raw': ['.raw', '.arw', '.cr2', '.nef', '.orf', '.rw2']
} as const

// Maximum file size in bytes (50MB)
export const MAX_IMAGE_SIZE = 50 * 1024 * 1024 