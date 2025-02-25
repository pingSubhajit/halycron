import {SingleAlbumView} from '@/app/app/albums/[id]/single-album-view'
import type {Metadata} from 'next'

type Props = {
	params: Promise<{ id: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const generateMetadata = async ({params}: Props): Promise<Metadata> => {
	const id = (await params).id
	/*
	 * const album = await getAlbumWithPhotoCount(id)
	 *
	 * if (!album) notFound()
	 *
	 * console.log('album', album)
	 */
	return {
		title: `${id} – Halycron`,
		description: `Access your private album ${id} securely with Halycron. View, manage, and organize your photos in an encrypted album. Protect sensitive content with a PIN and ensure your memories remain private.`
	}
}

const AlbumPage = async ({params}: {params: Promise<{id: string}>}) => {
	const {id} = await params
	console.log('id', id)

	return (
		<div>
			<SingleAlbumView albumId={id}/>
		</div>
	)
}

export default AlbumPage
