'use client'

import {useState, useEffect, useRef} from 'react'
import {useForm, useWatch} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@halycron/ui/components/dialog'
import {Button} from '@halycron/ui/components/button'
import {Input} from '@halycron/ui/components/input'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@halycron/ui/components/input-otp'
import {Label} from '@halycron/ui/components/label'
import {Switch} from '@halycron/ui/components/switch'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription} from '@halycron/ui/components/form'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@halycron/ui/components/select'
import {ExpiryOption, CreateShareLinkRequest} from '@/app/api/shared/types'
import {useCreateShareLink} from '@/app/api/shared/mutations'
import {usePhoto} from '@/app/api/photos/query'
import {useDecryptedUrl} from '@/hooks/use-decrypted-url'
import {toast} from 'sonner'
import {CopyIcon, CheckIcon, Loader2} from 'lucide-react'

interface ShareDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	photoIds?: string[]
	albumIds?: string[]
	requiresPin?: boolean // For protected/sensitive albums where PIN is mandatory
}

// Define form schema
const formSchema = z.object({
	expiryOption: z.enum(['1h', '24h', '3d', '7d', '30d']),
	isPinProtected: z.boolean(),
	pin: z.string()
		.refine(val => !val || val.length === 4, {
			message: 'PIN must be exactly 4 digits'
		})
		.refine(val => !val || /^\d+$/.test(val), {
			message: 'PIN must contain only digits'
		})
		.optional()
		.nullable()
})

export const ShareDialog = ({
	open,
	onOpenChange,
	photoIds = [],
	albumIds = [],
	requiresPin = false
}: ShareDialogProps) => {
	const [shareUrl, setShareUrl] = useState<string>('')
	const [copied, setCopied] = useState<boolean>(false)
	const [step, setStep] = useState<'form' | 'link'>('form')
	const pinInputRef = useRef<HTMLDivElement>(null)

	// Determine if we're sharing a single photo
	const isSinglePhoto = photoIds.length === 1

	// Fetch photo data if we're sharing a single photo
	const {data: photo, isLoading: isLoadingPhoto} = usePhoto(isSinglePhoto ? photoIds[0] : undefined)

	// Get the decrypted URL for the photo if available
	const decryptedUrl = useDecryptedUrl(photo)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			expiryOption: '24h' as ExpiryOption,
			isPinProtected: requiresPin,
			pin: ''
		}
	})

	// Watch form values
	const isPinProtected = useWatch({control: form.control, name: 'isPinProtected'})
	const pinValue = useWatch({control: form.control, name: 'pin'})

	// Focus PIN input when isPinProtected changes to true
	useEffect(() => {
		if (isPinProtected) {
			setTimeout(() => {
				const input = pinInputRef.current?.querySelector('input')
				if (input) {
					input.focus()
				}
			}, 100)
		}
	}, [isPinProtected])

	const {mutate: createShareLink, isPending} = useCreateShareLink()

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		// Validate PIN if required
		if (values.isPinProtected && (!values.pin || values.pin.length !== 4)) {
			toast.error('Please enter a 4-digit PIN')
			return
		}

		// Validate that we have something to share
		if (photoIds.length === 0 && albumIds.length === 0) {
			toast.error('No photos or albums selected for sharing')
			return
		}

		const shareData: CreateShareLinkRequest = {
			expiryOption: values.expiryOption as ExpiryOption,
			...(photoIds.length > 0 && {photoIds}),
			...(albumIds.length > 0 && {albumIds}),
			...(values.isPinProtected && values.pin && {pin: values.pin})
		}

		createShareLink(shareData, {
			onSuccess: (data) => {
				setShareUrl(data.shareUrl)
				setStep('link')
			},
			onError: (error: Error) => {
				toast.error(`Failed to create share link: ${error.message}`)
			}
		})
	}

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl)
			setCopied(true)
			toast.success('Link copied to clipboard')
			setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			toast.error('Failed to copy link')
		}
	}

	const resetDialog = () => {
		setStep('form')
		setShareUrl('')
		setCopied(false)
		form.reset({
			expiryOption: '24h' as ExpiryOption,
			isPinProtected: requiresPin,
			pin: ''
		})
	}

	const handleClose = (open: boolean) => {
		if (!open) {
			resetDialog()
		}
		onOpenChange(open)
	}

	const renderPhotoPreview = () => {
		if (!isSinglePhoto) return null

		if (isLoadingPhoto) {
			return (
				<div className="flex items-center justify-center h-[200px] bg-muted rounded-md mb-4">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			)
		}

		if (!photo) {
			return (
				<div className="flex items-center justify-center h-[200px] bg-muted rounded-md mb-4">
					<p className="text-sm text-muted-foreground">Unable to load photo preview</p>
				</div>
			)
		}

		if (!decryptedUrl) {
			return (
				<div className="flex items-center justify-center h-[200px] bg-muted rounded-md mb-4">
					<p className="text-sm text-muted-foreground">Decrypting photo...</p>
				</div>
			)
		}

		return (
			<div className="mb-4 overflow-hidden rounded-md border max-h-[250px]">
				{/* Render image without the lightbox functionality */}
				<div className="relative">
					<img
						src={decryptedUrl}
						alt={photo.originalFilename}
						className="w-full h-auto object-contain"
						style={{
							maxHeight: '250px',
							cursor: 'default'
						}}
						onClick={(e) => {
							// Prevent event propagation to avoid any default click handling
							e.preventDefault()
							e.stopPropagation()
						}}
					/>
				</div>
			</div>
		)
	}

	const getDialogTitle = () => {
		if (photoIds.length > 1) return `Share ${photoIds.length} Photos`
		if (photoIds.length === 1) return 'Share Photo'
		if (albumIds.length === 1) return 'Share Album'
		return 'Share Content'
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{getDialogTitle()}</DialogTitle>
					<DialogDescription>
						{step === 'form'
							? 'Create a secure sharable link to share your photos or albums.'
							: 'Share this link with others to give them access to your content.'}
					</DialogDescription>
				</DialogHeader>

				{step === 'form' ? (
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
							{renderPhotoPreview()}

							<FormField
								control={form.control}
								name="expiryOption"
								render={({field}) => (
									<FormItem>
										<FormLabel>Link Expiration</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select expiry time" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="1h">1 hour</SelectItem>
												<SelectItem value="24h">24 hours</SelectItem>
												<SelectItem value="3d">3 days</SelectItem>
												<SelectItem value="7d">7 days</SelectItem>
												<SelectItem value="30d">30 days</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isPinProtected"
								render={({field}) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
										<div className="space-y-0.5">
											<FormLabel>Protect with PIN</FormLabel>
											<FormDescription className="text-xs">
												{requiresPin ? 'Required for sensitive content' : 'Add PIN protection to this share link'}
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
												disabled={requiresPin}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{isPinProtected && (
								<FormField
									control={form.control}
									name="pin"
									render={({field}) => (
										<FormItem>
											<FormLabel>4-Digit PIN Code</FormLabel>
											<FormControl>
												<div ref={pinInputRef}>
													<InputOTP
														maxLength={4}
														value={field.value || ''}
														onChange={field.onChange}
													>
														<InputOTPGroup className="w-full justify-center">
															<InputOTPSlot index={0} className="w-full h-16" />
															<InputOTPSlot index={1} className="w-full h-16" />
															<InputOTPSlot index={2} className="w-full h-16" />
															<InputOTPSlot index={3} className="w-full h-16" />
														</InputOTPGroup>
													</InputOTP>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<Button
								type="submit"
								className="w-full"
								disabled={isPending || (isPinProtected && (!pinValue || pinValue.length !== 4))}
							>
								{isPending ? 'Creating...' : 'Create Share Link'}
							</Button>
						</form>
					</Form>
				) : (
					<div className="space-y-4 py-4">
						<div className="flex items-center space-x-2">
							<div className="grid flex-1 gap-2">
								<Label htmlFor="link" className="sr-only">Link</Label>
								<Input
									id="link"
									defaultValue={shareUrl}
									readOnly
									className="h-9"
								/>
							</div>
							<Button
								type="button"
								size="sm"
								className="px-3"
								onClick={copyToClipboard}
							>
								<span className="sr-only">Copy</span>
								{copied ? (
									<CheckIcon className="h-4 w-4" />
								) : (
									<CopyIcon className="h-4 w-4" />
								)}
							</Button>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="link"
								size="sm"
								onClick={resetDialog}
								className="text-muted-foreground p-0 h-auto"
							>
								Create new link
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
