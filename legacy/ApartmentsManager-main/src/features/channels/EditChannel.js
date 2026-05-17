import { useParams } from 'react-router-dom'
import EditChannelForm from './EditChannelForm'
import { useGetChannelsQuery } from './channelsApiSlice'
import useTitle from '../../hooks/useTitle'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditChannel = () => {
    useTitle('Edit Channel')

    const { id } = useParams()

    const { channel } = useGetChannelsQuery("channelsList", {
        selectFromResult: ({ data }) => ({
            channel: data?.entities[id]
        }),
    })

    if (!channel) return <LoadingSpinner />

    const content = <EditChannelForm channel={channel} />

    return content
}
export default EditChannel