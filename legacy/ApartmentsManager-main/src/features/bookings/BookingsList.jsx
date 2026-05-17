import { useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useGetBookingsQuery } from "./bookingsApiSlice";
import useAuth from '../../hooks/useAuth'
import useTitle from "../../hooks/useTitle";
import BookingCard from "../../components/booking-card/BookingCard";
import LoadingSpinner from "../../components/LoadingSpinner";


const BookingsList = () => {
    const { data: bookings, isLoading, isSuccess, isError, error } =
        useGetBookingsQuery("bookingsList", {
            pollingInterval: 60000,
            refetchOnFocus: true,
            refetchOnMountOrArgChange: true,
        });
    const { isManager } = useAuth();
    const { t } = useTranslation(["translation"])
    const navigate = useNavigate()


    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1);

    useTitle(t("nav.bookings"))

    if (isLoading) return <LoadingSpinner />

    if (isError) return <p className="errmsg">{error?.data?.message}</p>;

    if (!isSuccess) return null

    const { entities } = bookings;
    const sortedBookings = Object.values(entities)
        .filter(booking =>
            booking.client.name.toLowerCase().includes(search.toLowerCase()) ||
            booking.apartment.name.toLowerCase().includes(search.toLowerCase()) ||
            booking.channel.name.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setCurrentPage(1)
    };

    const handleNew = () => navigate('/private/bookings/new')

    const itemsPerPage = 10; // Adjust the number of items per page as needed

    const indexOfLastBooking = currentPage * itemsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
    const currentBookings = sortedBookings.slice(indexOfFirstBooking, indexOfLastBooking);
    const maxPages = Math.ceil(sortedBookings.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const displayPageRange = 5;

    const renderPaginationButtons = () => {
        const buttons = [];
        const startPage = Math.max(1, currentPage - Math.floor(displayPageRange / 2));
        const endPage = Math.min(maxPages, startPage + displayPageRange - 1);

        if (startPage > 1) {
            buttons.push(
                <button key={1} onClick={() => paginate(1)}>
                    1
                </button>
            );
            if (startPage > 2) {
                buttons.push(<span key="ellipsis-start">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => paginate(i)}
                    className={currentPage === i ? "active" : ""}
                >
                    {i}
                </button>
            );
        }

        if (endPage < maxPages) {
            if (endPage < maxPages - 1) {
                buttons.push(<span key="ellipsis-end">...</span>);
            }
            buttons.push(
                <button key={maxPages} onClick={() => paginate(maxPages)}>
                    {maxPages}
                </button>
            );
        }

        return buttons;
    };

    return (
        <section className="content-grid">
            <h1> {t("nav.bookings")}</h1>
            <div className="content-list__wrapper">
                <div className="content-list__header">
                    <input
                        type="text"
                        placeholder={t("nav.search")}
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="content-list__grid">
                    {isManager && <div className="content-list__new-item" onClick={handleNew}>
                        <p><FontAwesomeIcon icon={faPlus} /></p>
                        <p>{t("private.new-record")}</p>
                    </div>}
                    {currentBookings.map((booking) =>
                        <BookingCard booking={booking} key={booking.id} />
                    )}
                </div>
            </div>
            <div className="pagination">
                {renderPaginationButtons()}
            </div>
        </section>
    );

};

export default BookingsList;
