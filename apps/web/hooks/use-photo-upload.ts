import {useCallback, useEffect, useRef, useState} from 'react'
import {Photo, UploadState} from '@/app/api/photos/types'
import {useUploadPhoto} from '@/app/api/photos/mutation'
import {useQueryClient} from '@tanstack/react-query'
import {photoQueryKeys} from '@/app/api/photos/keys'
import {FileRejection} from 'react-dropzone'

interface UsePhotoUploadOptions {
  onPhotoUploaded?: (photo: Photo) => void
  showProgressInitially?: boolean
}

interface UsePhotoUploadResult {
  uploadStates: Record<string, UploadState>
  showProgress: boolean
  setShowProgress: (show: boolean) => void
  onDrop: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => void
  fileRejections: FileRejection[]
}

export const usePhotoUpload = ({
  onPhotoUploaded,
  showProgressInitially = false
}: UsePhotoUploadOptions = {}): UsePhotoUploadResult => {
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})
  const [showProgress, setShowProgress] = useState(showProgressInitially)
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([])
  const uploadQueue = useRef<File[]>([])
  const processingFiles = useRef<Set<string>>(new Set())
  const queryClient = useQueryClient()
  const hasSuccessfulUploads = useRef(false)

  const {mutate: uploadFile} = useUploadPhoto(setUploadStates, {
    onSuccess: (photo) => {
      onPhotoUploaded?.(photo)
    }
  })

  const checkAndInvalidateQueries = useCallback(() => {
    if (processingFiles.current.size === 0 && hasSuccessfulUploads.current) {
      queryClient.invalidateQueries({queryKey: photoQueryKeys.allPhotos()})
      hasSuccessfulUploads.current = false
    }
  }, [queryClient])

  const processQueue = useCallback(() => {
    if (!showProgress) setShowProgress(true)

    const availableSlots = 10 - processingFiles.current.size
    if (availableSlots <= 0 || uploadQueue.current.length === 0) return

    const filesToProcess = uploadQueue.current.slice(0, availableSlots)
    uploadQueue.current = uploadQueue.current.slice(availableSlots)

    filesToProcess.forEach(file => {
      processingFiles.current.add(file.name)
      uploadFile(file)
      setUploadStates(prev => ({
        ...prev,
        [file.name]: {progress: 0, status: 'idle'}
      }))
    })
  }, [uploadFile, showProgress])

  useEffect(() => {
    const completedFiles = Object.entries(uploadStates).filter(
      ([_, state]) => state.status === 'uploaded' || state.status === 'error'
    )

    if (completedFiles.length > 0) {
      completedFiles.forEach(([fileName, state]) => {
        processingFiles.current.delete(fileName)
        if (state.status === 'uploaded') {
          hasSuccessfulUploads.current = true
        }
      })

      checkAndInvalidateQueries()
    }

    if (uploadQueue.current.length > 0) {
      processQueue()
    }
  }, [uploadStates, processQueue, checkAndInvalidateQueries])

  useEffect(() => {
    if (showProgress && !Object.entries(uploadStates).find(([_, state]) => state.status !== 'uploaded' && state.status !== 'error')) {
      const timeout = setTimeout(() => {
        setShowProgress(false)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [uploadStates, showProgress])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setFileRejections(rejectedFiles)
    uploadQueue.current.push(...acceptedFiles)
    processQueue()
  }, [processQueue])

  return {
    uploadStates,
    showProgress,
    setShowProgress,
    onDrop,
    fileRejections
  }
} 