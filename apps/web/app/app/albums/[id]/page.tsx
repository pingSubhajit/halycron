import {SingleAlbumView} from '@/app/app/albums/[id]/single-album-view'

interface Props {
	params: {
		id: string
	}
}

const AlbumPage = ({params}: Props) => (
	<div>
		<SingleAlbumView albumId={params.id}/>
	</div>
)

export default AlbumPage
