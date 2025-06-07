'use client'

import {useEffect, useState} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@halycron/ui/components/card'
import {Button} from '@halycron/ui/components/button'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@halycron/ui/components/form'
import {Input} from '@halycron/ui/components/input'
import {Switch} from '@halycron/ui/components/switch'
import {Progress} from '@halycron/ui/components/progress'
import {AlertCircle, CheckCircle, Cloud, Download, HardDrive, Info, Server, Trash2} from 'lucide-react'
import {useStorageStats} from '@/app/api/storage/query'
import {TextShimmer} from '@halycron/ui/components/text-shimmer'

const s3ConfigSchema = z.object({
	bucketName: z.string().min(3, 'Bucket name must be at least 3 characters'),
	region: z.string().min(2, 'Region is required'),
	accessKeyId: z.string().min(1, 'Access Key ID is required'),
	secretAccessKey: z.string().min(1, 'Secret Access Key is required')
})

export const StorageSettings = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [useCustomS3, setUseCustomS3] = useState(false)
	const [connectionTested, setConnectionTested] = useState(false)

	// Fetch storage statistics
	const {data: storageStats, isLoading: isLoadingStats, error} = useStorageStats()

	const form = useForm<z.infer<typeof s3ConfigSchema>>({
		resolver: zodResolver(s3ConfigSchema),
		defaultValues: {
			bucketName: '',
			region: 'us-east-1',
			accessKeyId: '',
			secretAccessKey: ''
		}
	})

	const handleTestConnection = async () => {
		setIsLoading(true)
		try {
			// TODO: Implement S3 connection test
			await new Promise(resolve => setTimeout(resolve, 2000))
			setConnectionTested(true)
		} catch (error) {
			console.error('S3 connection test failed:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleSaveS3Config = async (values: z.infer<typeof s3ConfigSchema>) => {
		setIsLoading(true)
		try {
			// TODO: Implement S3 config save
			await new Promise(resolve => setTimeout(resolve, 1000))
		} catch (error) {
			console.error('Failed to save S3 config:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Use real storage data or fallback to defaults
	const storageUsage = storageStats || {
		used: 0,
		total: 5, // 5GB default for Halycron Cloud
		photos: 0,
		storageType: 'halycron' as const
	}

	const usagePercentage = (storageUsage.used / storageUsage.total) * 100

	// Update the custom S3 state based on storage type
	useEffect(() => {
		if (storageStats?.storageType === 'custom-s3') {
			setUseCustomS3(true)
		}
	}, [storageStats?.storageType])

	if (error) {
		return (
			<div className="space-y-6">
				<Card>
					<CardContent className="pt-6">
						<div className="text-center text-red-600">
							<AlertCircle className="h-8 w-8 mx-auto mb-2"/>
							<p>Failed to load storage information</p>
							<p className="text-sm text-muted-foreground mt-1">{error.message}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Storage Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Download className="h-5 w-5"/>
						Storage Overview
					</CardTitle>
					<CardDescription>
						Monitor your storage usage and manage your configuration
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Storage Used</span>
								{isLoadingStats && <TextShimmer duration={1} className="text-sm text-right">
									Calculating usage
								</TextShimmer>}
								{!isLoadingStats && <span className="text-sm text-muted-foreground">
									{`${storageUsage.used} GB of ${storageUsage.total} GB`}
								</span>}
							</div>
							<Progress
								value={isLoadingStats ? 0 : usagePercentage}
								className={`h-2 ${usagePercentage > 80 ? 'text-red-600' : usagePercentage > 60 ? 'text-yellow-600' : ''}`}
							/>
							<div className="flex items-center justify-between text-sm text-muted-foreground">
								{isLoadingStats && <TextShimmer duration={1} className="text-sm text-right">
									Calculating usage
								</TextShimmer>}
								{!isLoadingStats && <span>{storageUsage.photos} photos stored</span>}

								{isLoadingStats && <TextShimmer duration={1} className="text-sm text-right">
									Calculating usage
								</TextShimmer>}
								{!isLoadingStats &&
                                    <span>{Math.round((storageUsage.total - storageUsage.used) * 100) / 100} GB available</span>}
							</div>
							{usagePercentage > 80 && storageUsage.storageType === 'halycron' && (
								<div className="p-3 bg-orange-50 border border-orange-200">
									<div className="flex items-center gap-2 text-orange-700">
										<AlertCircle className="h-4 w-4"/>
										<span className="text-sm font-medium">Storage almost full</span>
									</div>
									<p className="text-sm text-orange-600 mt-1">
										You're using {usagePercentage.toFixed(1)}% of your Halycron Cloud storage.
										Consider upgrading to a custom S3 bucket for unlimited storage.
									</p>
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="flex items-center gap-3 p-4 border">
								<div className="p-2 bg-blue-500/10">
									<Cloud className="h-5 w-5 text-blue-500"/>
								</div>
								<div>
									<div className="font-medium">Photos</div>
									<div className="text-sm text-muted-foreground">
										{isLoadingStats ? 'Loading...' : `${storageUsage.photos} files`}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3 p-4 border">
								<div className="p-2 bg-green-500/10">
									<HardDrive className="h-5 w-5 text-green-500"/>
								</div>
								<div>
									<div className="font-medium">Encrypted Size</div>
									<div className="text-sm text-muted-foreground">
										{isLoadingStats ? 'Loading...' : `${storageUsage.used} GB`}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3 p-4 border">
								<div className="p-2 bg-purple-500/10">
									<Server className="h-5 w-5 text-purple-500"/>
								</div>
								<div>
									<div className="font-medium">Storage Type</div>
									<div className="text-sm text-muted-foreground">
										{storageUsage.storageType === 'custom-s3' ? 'Custom S3' : 'Halycron Cloud'}
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Storage Configuration */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Server className="h-5 w-5"/>
						Storage Configuration
					</CardTitle>
					<CardDescription>
						Choose between Halycron's secure storage or your own S3 bucket
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between p-4 border">
						<div>
							<div className="font-medium">Use Custom S3 Bucket</div>
							<div className="text-sm text-muted-foreground">
								Store your encrypted photos in your own AWS S3 bucket for complete control
							</div>
						</div>
						<Switch
							checked={useCustomS3}
							onCheckedChange={setUseCustomS3}
						/>
					</div>

					{!useCustomS3 && (
						<div className="p-4 bg-blue-500/10 border border-blue-500/20">
							<div className="flex items-center gap-2 text-blue-600 mb-2">
								<Cloud className="h-4 w-4"/>
								<span className="font-medium">Using Halycron Cloud Storage</span>
							</div>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>• Fully managed secure storage (5GB included)</li>
								<li>• Automatic backups and redundancy</li>
								<li>• No S3 configuration required</li>
								<li>• Encrypted at rest and in transit</li>
								<li>• Upgrade to custom S3 for unlimited storage</li>
							</ul>
						</div>
					)}

					{useCustomS3 && (
						<div className="space-y-4">
							<div className="p-4 bg-yellow-500/10 border border-yellow-500/20">
								<div className="flex items-center gap-2 text-yellow-600 mb-2">
									<AlertCircle className="h-4 w-4"/>
									<span className="font-medium">Custom S3 Configuration</span>
								</div>
								<p className="text-sm text-muted-foreground">
									Your photos will be encrypted before being stored in your S3 bucket. Make sure your
									bucket has appropriate permissions.
								</p>
							</div>

							<Form {...form}>
								<form onSubmit={form.handleSubmit(handleSaveS3Config)} className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="bucketName"
											render={({field}) => (
												<FormItem>
													<FormLabel>Bucket Name</FormLabel>
													<FormControl>
														<Input placeholder="my-halycron-photos" {...field} />
													</FormControl>
													<FormMessage/>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="region"
											render={({field}) => (
												<FormItem>
													<FormLabel>AWS Region</FormLabel>
													<FormControl>
														<Input placeholder="us-east-1" {...field} />
													</FormControl>
													<FormMessage/>
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="accessKeyId"
										render={({field}) => (
											<FormItem>
												<FormLabel>Access Key ID</FormLabel>
												<FormControl>
													<Input placeholder="AKIA..." {...field} />
												</FormControl>
												<FormDescription>
													Create an IAM user with S3 permissions for your bucket
												</FormDescription>
												<FormMessage/>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="secretAccessKey"
										render={({field}) => (
											<FormItem>
												<FormLabel>Secret Access Key</FormLabel>
												<FormControl>
													<Input type="password" placeholder="..." {...field} />
												</FormControl>
												<FormMessage/>
											</FormItem>
										)}
									/>

									<div className="flex items-center gap-3">
										<Button
											type="button"
											variant="outline"
											onClick={handleTestConnection}
											disabled={isLoading}
										>
											{isLoading ? 'Testing...' : 'Test Connection'}
										</Button>

										{connectionTested && (
											<div className="flex items-center gap-2 text-green-600">
												<CheckCircle className="h-4 w-4"/>
												<span className="text-sm">Connection successful</span>
											</div>
										)}
									</div>

									{connectionTested && (
										<Button type="submit" disabled={isLoading}>
											{isLoading ? 'Saving...' : 'Save S3 Configuration'}
										</Button>
									)}
								</form>
							</Form>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Data Management */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trash2 className="h-5 w-5"/>
						Data Management
					</CardTitle>
					<CardDescription>
						Manage your stored data and cleanup options
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						<div className="flex items-center justify-between p-4 border">
							<div>
								<div className="font-medium">Download All Data</div>
								<div className="text-sm text-muted-foreground">
									Export all your photos and metadata in encrypted format
								</div>
							</div>
							<Button variant="outline">
								<Download className="h-4 w-4 mr-2"/>
								Export Data
							</Button>
						</div>

						<div className="flex items-center justify-between p-4 border">
							<div>
								<div className="font-medium">Clear Thumbnail Cache</div>
								<div className="text-sm text-muted-foreground">
									Clear locally cached thumbnails to free up space
								</div>
							</div>
							<Button variant="outline">
								Clear Cache
							</Button>
						</div>

						<div className="flex items-center justify-between p-4 border border-destructive/20">
							<div>
								<div className="font-medium text-destructive">Delete All Photos</div>
								<div className="text-sm text-muted-foreground">
									Permanently delete all photos from your storage
								</div>
							</div>
							<Button variant="destructive">
								<Trash2 className="h-4 w-4 mr-2"/>
								Delete All
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Storage Information */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Info className="h-5 w-5"/>
						Storage Information
					</CardTitle>
					<CardDescription>
						How your data is stored and encrypted
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="p-4 bg-muted/30">
						<h4 className="font-medium mb-2">Encryption & Security</h4>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• All photos are encrypted with AES-256-GCM before upload</li>
							<li>• Each photo has a unique encryption key</li>
							<li>• Metadata is encrypted separately with your master key</li>
							<li>• Zero-knowledge architecture - we cannot see your photos</li>
							<li>• Thumbnails are generated and encrypted locally</li>
							<li>• Your encryption keys never leave your device unencrypted</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
