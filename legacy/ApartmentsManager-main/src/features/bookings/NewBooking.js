import NewBookingForm from './NewBookingForm'
import { useGetClientsQuery } from '../clients/clientsApiSlice'
import { useGetApartmentsQuery } from '../apartments/apartmentsApiSlice'
import { useGetChannelsQuery } from '../channels/channelsApiSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const NewBooking = () => {

    const { clients } = useGetClientsQuery("clientsList", {
        selectFromResult: ({ data }) => ({
            clients: data?.ids.map(id => data?.entities[id])
        }),
    })
    
    const { channels } = useGetChannelsQuery("channelsList", {
        selectFromResult: ({ data }) => ({
            channels: data?.ids.map(id => data?.entities[id])
        }),
    })

    const { apartments } = useGetApartmentsQuery("apartmentsList", {
        selectFromResult: ({ data }) => ({
            apartments: data?.ids.map(id => data?.entities[id])
        }),
    })

    if (!clients?.length || !channels?.length || !apartments?.length) return <LoadingSpinner />

    return <NewBookingForm apartments={apartments} clients={clients} channels={channels}   />
    
}
export default NewBooking