import { useNavigate } from 'react-router-dom'
import { useGetChannelsQuery } from './channelsApiSlice'
import { memo } from 'react'
import {
    TableRow,
      TableCell
    } from "../../components/TableElements"
const Channel = ({ channelId, search }) => {

    const { channel } = useGetChannelsQuery("channelsList", {
        selectFromResult: ({ data }) => ({
            channel: data?.entities[channelId]
        }),
    })

    const navigate = useNavigate()

    if (!channel) return

    if (search !== "" && search) {
        const lowerCaseSearch = search.toLowerCase();
        const isNameMatch = channel.name.toLowerCase().includes(lowerCaseSearch);
        if (!isNameMatch) {
            return null;
        }
    }
    
    const handleEdit = () => navigate(`/private/channels/${channelId}`)

    return (
        <TableRow onClick={handleEdit}>
            <TableCell>{channel.name}</TableCell>
            <TableCell>{channel.commissionRate}</TableCell>
            <TableCell>{channel.isActive}</TableCell>
        </TableRow>
    )


}

const memoizedChannel = memo(Channel)

export default memoizedChannel