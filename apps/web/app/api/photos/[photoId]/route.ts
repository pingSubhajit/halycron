import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/lib/auth/config'
import {headers} from 'next/headers'
import {db} from '@/db/drizzle'
import {generatePresignedDownloadUrl} from '@/lib/s3-client'

// Helper function to get albums that a user has access to
const getUserAlbumIds = async (userId: string): Promise<string[]> => {
	// Get all albums that the user owns
	const userAlbums = await db.query.album.findMany({
		where: (albums, {eq}) => eq(albums.userId, userId),
		columns: {
			id: true
		}
	})

	return userAlbums.map(album => album.id)
}

// GET /api/photos/[photoId]
export async function GET(
	request: NextRequest,
	{params}: { params: { photoId: string } }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		})

		if (!session?.user) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		const {photoId} = params
		if (!photoId) {
			return NextResponse.json({error: 'Photo ID is required'}, {status: 400})
		}

		// Get the photo
		const userPhoto = await db.query.photo.findFirst({
			where: (photos, {and, eq}) => and(
				eq(photos.id, photoId),
				eq(photos.userId, session.user.id)
			),
			with: {
				albums: {
					with: {
						album: {
							columns: {
								id: true,
								name: true
							}
						}
					}
				}
			}
		})

		if (!userPhoto) {
			// Also check if the photo might be in a shared album
			const userAlbumIds = await getUserAlbumIds(session.user.id)

			if (userAlbumIds.length === 0) {
				return NextResponse.json({error: 'Photo not found'}, {status: 404})
			}

			// Check if the photo is in any of these albums
			const photoInSharedAlbum = await db.query.photo.findFirst({
				where: (photos, {eq}) => eq(photos.id, photoId),
				with: {
					albums: {
						where: (photoAlbums, {inArray}) => inArray(photoAlbums.albumId, userAlbumIds),
						with: {
							album: {
								columns: {
									id: true,
									name: true
								}
							}
						}
					}
				}
			})

			// If we don't find any photos or the photo doesn't have any albums that the user has access to
			if (!photoInSharedAlbum || photoInSharedAlbum.albums.length === 0) {
				return NextResponse.json({error: 'Photo not found'}, {status: 404})
			}

			// Generate a presigned URL for the photo
			const url = await generatePresignedDownloadUrl(photoInSharedAlbum.s3Key)

			// Format the response to match the expected structure
			const formattedPhoto = {
				...photoInSharedAlbum,
				url,
				albums: photoInSharedAlbum.albums.map(pa => ({
					id: pa.album.id,
					name: pa.album.name
				}))
			}

			return NextResponse.json(formattedPhoto)
		}

		// Generate a presigned URL for the photo
		const url = await generatePresignedDownloadUrl(userPhoto.s3Key)

		// Format the response to match the expected structure
		const formattedPhoto = {
			...userPhoto,
			url,
			albums: userPhoto.albums.map(pa => ({
				id: pa.album.id,
				name: pa.album.name
			}))
		}

		return NextResponse.json(formattedPhoto)
	} catch (error) {
		console.error('Error fetching photo:', error)
		return NextResponse.json(
			{error: 'Error fetching photo'},
			{status: 500}
		)
	}
}
