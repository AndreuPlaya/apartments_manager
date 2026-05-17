import { useParams } from 'react-router-dom'
import EditBookingForm from './EditBookingForm'
import { useGetBookingsQuery } from './bookingsApiSlice'
import { useGetClientsQuery } from '../clients/clientsApiSlice'
import { useGetChannelsQuery } from '../channels/channelsApiSlice'
import { useGetApartmentsQuery } from '../apartments/apartmentsApiSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditBooking = () => {

    const { id } = useParams()

    const { booking } = useGetBookingsQuery("bookingsList", {
        selectFromResult: ({ data }) => ({
            booking: data?.entities[id]
        }),
    })

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

    if (!booking || !clients?.length || !channels?.length || !apartments?.length) return <LoadingSpinner />

    const content = <EditBookingForm booking={booking} clients={clients} channels={channels} apartments={apartments} />

    return content
}
export default EditBooking