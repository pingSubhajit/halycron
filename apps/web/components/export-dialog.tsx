'use client'

import {useEffect, useState} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@halycron/ui/components/dialog'
import {Button} from '@halycron/ui/components/button'
import {Progress} from '@halycron/ui/components/progress'
import {Alert, AlertDescription} from '@halycron/ui/components/alert'
import {AlertCircle, CheckCircle, Download, FileArchive, Info, Loader2, Shield} from 'lucide-react'
import {useCreateExport, useCurrentUserExport, useExportStatus, useLatestUserExport} from '@/app/api/export/query'
import {format} from 'date-fns'

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const ExportDialog = ({open, onOpenChange}: Props) => {
	const [exportId, setExportId] = useState<string | undefined>()
	const createExport = useCreateExport()
	const {data: exportStatus} = useExportStatus(exportId)
	const {data: ongoingExport} = useCurrentUserExport() // Only pending/processing exports
	const {data: latestExport} = useLatestUserExport() // Latest export regardless of status

	// Use ongoing export if available, otherwise use latest export, otherwise use local exportId status
	const activeExport = ongoingExport || latestExport || exportStatus

	// Update local exportId when we have an export to track
	useEffect(() => {
		const exportToTrack = ongoingExport || latestExport
		if (exportToTrack?.id && !exportId) {
			setExportId(exportToTrack.id)
		}
	}, [ongoingExport?.id, latestExport?.id, exportId])

	const handleStartExport = () => {
		createExport.mutate(undefined, {
			onSuccess: (data) => {
				setExportId(data.id)
			}
		})
	}

	const handleDownload = () => {
		if (activeExport?.downloadUrl) {
			window.open(activeExport.downloadUrl, '_blank')
		}
	}

	const getStatusIcon = () => {
		switch (activeExport?.status) {
		case 'pending':
		case 'processing':
			return <Loader2 className="h-5 w-5 animate-spin text-blue-500"/>
		case 'ready':
			return <CheckCircle className="h-5 w-5 text-green-500"/>
		case 'failed':
			return <AlertCircle className="h-5 w-5 text-red-500"/>
		default:
			return <FileArchive className="h-5 w-5 text-muted-foreground"/>
		}
	}

	const getStatusText = () => {
		switch (activeExport?.status) {
		case 'pending':
			return 'Preparing export...'
		case 'processing':
			return `Processing photos (${activeExport.processedPhotos}/${activeExport.totalPhotos})`
		case 'ready':
			return 'Export ready for download'
		case 'failed':
			return 'Export failed'
		default:
			return 'Ready to start export'
		}
	}

	const progressPercentage = activeExport?.totalPhotos
		? (activeExport.processedPhotos / activeExport.totalPhotos) * 100
		: 0

	// Only prevent new exports if there's an ongoing export (pending or processing)
	const hasOngoingExport = ongoingExport?.status === 'pending' || ongoingExport?.status === 'processing'
	const canStartNewExport = !hasOngoingExport && !createExport.isPending

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Download className="h-5 w-5"/>
						Export Your Data
					</DialogTitle>
					<DialogDescription>
						Download all your photos, albums, and metadata in an encrypted format
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Export Information */}
					<Alert>
						<Info className="h-4 w-4"/>
						<AlertDescription>
							Your export will include:
							<ul className="mt-2 space-y-1 text-sm">
								<li>• All encrypted photos with decryption keys</li>
								<li>• Album structure and metadata</li>
								<li>• Web-based decryption tool</li>
								<li>• Shared links information</li>
							</ul>
						</AlertDescription>
					</Alert>

					{/* Security Notice */}
					<Alert>
						<Shield className="h-4 w-4"/>
						<AlertDescription className="text-sm">
							<strong>Security:</strong> Your photos remain encrypted in the export.
							The included decryption tool will allow you to decrypt them using your master key.
						</AlertDescription>
					</Alert>

					{/* Export Status */}
					{(activeExport || createExport.isPending) && (
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								{getStatusIcon()}
								<div className="flex-1">
									<div className="font-medium">{getStatusText()}</div>
									{activeExport?.status === 'processing' && (
										<div className="text-sm text-muted-foreground">
											This may take a few minutes...
										</div>
									)}
								</div>
							</div>

							{activeExport?.status === 'processing' && (
								<Progress value={progressPercentage} className="h-2"/>
							)}

							{activeExport?.status === 'ready' && (
								<div className="space-y-3">
									<div className="text-sm text-muted-foreground">
										Export created
										on {format(new Date(activeExport.createdAt), 'MMM dd, yyyy at h:mm a')}
									</div>
									{activeExport.expiresAt && (
										<div className="text-sm text-orange-600">
											Download expires
											on {format(new Date(activeExport.expiresAt), 'MMM dd, yyyy')}
										</div>
									)}
								</div>
							)}

							{activeExport?.status === 'failed' && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4"/>
									<AlertDescription>
										Export failed to complete.
										{activeExport.errorMessage && (
											<div className="mt-1 text-sm">
												Error: {activeExport.errorMessage}
											</div>
										)}
										Please try again or contact support if the issue persists.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					{/* Active Export Notice */}
					{hasOngoingExport && (
						<Alert>
							<Info className="h-4 w-4"/>
							<AlertDescription>
								You have an export in progress. Please wait for it to complete before starting a new
								one.
							</AlertDescription>
						</Alert>
					)}

					{/* Action Buttons */}
					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Close
						</Button>

						{canStartNewExport && (
							<Button
								onClick={handleStartExport}
								disabled={createExport.isPending}
							>
								{createExport.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
								Start Export
							</Button>
						)}

						{activeExport?.status === 'ready' && (
							<Button onClick={handleDownload}>
								<Download className="h-4 w-4 mr-2"/>
								Download Export
							</Button>
						)}

						{activeExport?.status === 'failed' && (
							<Button
								onClick={handleStartExport}
								disabled={createExport.isPending}
							>
								Retry Export
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
