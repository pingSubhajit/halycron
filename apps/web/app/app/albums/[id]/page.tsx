import {SingleAlbumView} from '@/app/app/albums/[id]/single-album-view'

const AlbumPage = async ({params}: {params: Promise<{id: string}>}) => {
	const {id} = await params

	return (
		<div>
			<SingleAlbumView albumId={id}/>
		</div>
	)
}

export default AlbumPage
