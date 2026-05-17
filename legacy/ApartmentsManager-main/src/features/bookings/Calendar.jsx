import { useTranslation } from 'react-i18next'
import { useGetBookingsQuery } from "./bookingsApiSlice";
import BookingsCalendar from "../../components/calendar/BookingsCalendar"
import useTitle from '../../hooks/useTitle';
import LoadingSpinner from "../../components/LoadingSpinner";

function Calendar() {
    const today = new Date();

    const { t } = useTranslation(['translation']);

    useTitle(t('nav.calendar'));

       

    const {
        data: bookings,
        isLoading,
        isSuccess,
        isError,
        error,
    } = useGetBookingsQuery('bookingsList', {
        pollingInterval: 15000,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true,
    });

    if (isLoading) return <LoadingSpinner />

    if (isError) return <p className="errmsg">{error?.data?.message}</p>

    if (!isSuccess) return null;  
    
    return (
        <section className="content-grid">
            <BookingsCalendar bookings={bookings} defaultDate={today} />
        </section>
    )
}

export default Calendar