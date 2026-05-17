import { store } from '../../app/store'
import { apartmentsApiSlice } from '../apartments/apartmentsApiSlice'
//import { bookingsApiSlice } from '../bookings/bookingsApiSlice'
import { clientsApiSlice } from '../clients/clientsApiSlice'
//import { invoicesApiSlice } from '../invoices/invoicesApiSlice'
import { channelsApiSlice } from '../channels/channelsApiSlice'
import { usersApiSlice } from '../users/usersApiSlice'
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const Prefetch = () => {

    useEffect(() => {
        store.dispatch(apartmentsApiSlice.util.prefetch('getApartments', 'apartmentsList', { force: true }))
        //store.dispatch(bookingsApiSlice.util.prefetch('getBookings', 'bookingsList', { force: true }))
        store.dispatch(clientsApiSlice.util.prefetch('getClients', 'clientsList', { force: true }))
        //store.dispatch(invoicesApiSlice.util.prefetch('getInvoices', 'invoicesList', { force: true }))
        store.dispatch(channelsApiSlice.util.prefetch('getChannels', 'channelsList', { force: true }))
        store.dispatch(usersApiSlice.util.prefetch('getUsers', 'usersList', { force: true }))
    }, [])

    return <Outlet />
}
export default Prefetch