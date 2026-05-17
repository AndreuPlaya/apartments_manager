import { useParams } from 'react-router-dom'
import EditClientForm from './EditClientForm'
import { useGetBookingsQuery } from "../bookings/bookingsApiSlice"
import { useGetClientsQuery } from './clientsApiSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditClient = () => {

    const { id } = useParams()

    const { client } = useGetClientsQuery("clientsList", {
        selectFromResult: ({ data }) => ({
            client: data?.entities[id]
        }),
    })

    const {
        data: bookings,
        isLoading,
        isSuccess,
        isError,
        error
    } = useGetBookingsQuery('bookingsList', {
        pollingInterval: 15000,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })
    
    if (!client || isLoading ) return <LoadingSpinner />

    if (isError) return <p className="errmsg">{error?.data?.message}</p>

    if (!isSuccess) return null
    const filteredBookings = Object.values(bookings.entities).filter((booking) => {
        return booking.client._id === client._id;
    });
    const bookingList = filteredBookings;
    return <EditClientForm client={client} bookings={bookingList} />

}
export default EditClient