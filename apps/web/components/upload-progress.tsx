import {AlertCircle} from 'lucide-react'
import {AnimatePresence, motion} from 'framer-motion'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'
import {cn} from '@halycron/ui/lib/utils'
import {Portal} from '@radix-ui/react-portal'

export type UploadState = {
    status: string
}

type Props = {
    uploadStates: Record<string, UploadState>
    showProgress: boolean
    className?: string
}

export const UploadProgress = ({uploadStates, showProgress, className}: Props) => {
    return (
        <AnimatePresence>
            {Object.entries(uploadStates).length > 0 && showProgress && (
                <Portal>
                    <motion.div
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.8}}
                        className={cn(
                            'fixed bottom-4 right-4 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[100]',
                            className
                        )}
                    >
                        <div className="overflow-y-auto flex flex-col gap-2">
                            {Object.entries(uploadStates).map(([fileName, state]) => (
                                <div
                                    key={fileName}
                                    className={cn(
                                        'w-full text-sm flex items-center justify-between gap-2 px-2 py-1 bg-accent rounded-sm',
                                        state.status !== 'uploaded' && state.status !== 'error' && 'animate-pulse'
                                    )}
                                >
                                    <p className="truncate opacity-80">{fileName}</p>

                                    {(state.status === 'uploaded' || state.status === 'error') && (
                                        <div className={cn(
                                            'text-yellow-300 flex items-center gap-1',
                                            state.status === 'uploaded' && 'text-primary',
                                            state.status === 'error' && 'text-red-500'
                                        )}>
                                            <span>{state.status}</span>
                                            {state.status === 'error' && <AlertCircle className="h-4 w-4" />}
                                        </div>
                                    )}

                                    {state.status !== 'uploaded' && state.status !== 'error' && (
                                        <TextShimmer duration={1}>
                                            {state.status}
                                        </TextShimmer>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </Portal>
            )}
        </AnimatePresence>
    )
} 