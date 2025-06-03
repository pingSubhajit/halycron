'use client'

import {ReactNode, useState} from 'react'
import {ContextMenuItem} from '@halycron/ui/components/context-menu'
import {Share2} from 'lucide-react'
import {ShareDialog} from '@/components/share/share-dialog'

interface ShareMenuItemProps {
  photoIds?: string[]
  albumIds?: string[]
  requiresPin?: boolean
  className?: string
	children?: ReactNode
}

export const ShareMenuItem = ({
	photoIds = [],
	albumIds = [],
	requiresPin = false,
	className,
	children
}: ShareMenuItemProps) => {
	const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

	return (
		<>
			<ContextMenuItem
				className={className}
				onSelect={(e) => {
					e.preventDefault()
					setIsShareDialogOpen(true)
				}}
			>
				<div className="flex items-center justify-between w-full">
					<span>{children || 'Share'}</span>
					<Share2 className="h-4 w-4" />
				</div>
			</ContextMenuItem>

			<ShareDialog
				open={isShareDialogOpen}
				onOpenChange={setIsShareDialogOpen}
				photoIds={photoIds}
				albumIds={albumIds}
				requiresPin={requiresPin}
			/>
		</>
	)
}
