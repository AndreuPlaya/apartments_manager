import { useNavigate } from 'react-router-dom'
import { memo } from 'react'
import { useTranslation } from "react-i18next";
import { dayNamesLong, monthNames } from '../../config/data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowsToCircle, faBed, faBuilding, faCalendarAlt, faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import "./booking-card.css"

const BookingCard = ({ booking }) => {
    const navigate = useNavigate()
    const { t } = useTranslation(["translation"])
    if (!booking) return null

    const handleEdit = () => {
        navigate(`/private/bookings/${booking.id}`)
    }

    const startDate = new Date(booking.fromDate);
    const endDate = new Date(booking.toDate);
    const checkinDate = `${t(dayNamesLong[(startDate.getDay() + 6) % 7])} ${startDate.getDate()} ${t(monthNames[startDate.getMonth()]).substring(0, 3).toLowerCase()} ${startDate.getFullYear()}`
    const checkoutDate = `${t(dayNamesLong[(endDate.getDay() + 6) % 7])} ${endDate.getDate()} ${t(monthNames[endDate.getMonth()]).substring(0, 3).toLowerCase()} ${endDate.getFullYear()}`
    const nights = new Date(endDate - startDate).getDate() - 1
    let personCount;
    if (booking.childrenCount > 0) {
        personCount = `${booking.adultCount} + ${booking.childrenCount}`;
    } else {
        personCount = booking.adultCount;
    }

    return (
        <div className="booking-card__wrapper" onClick={handleEdit}>

            <div className="booking-card__grid">

                <p>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    {checkinDate}
                    <FontAwesomeIcon icon={faArrowRight} />
                    {checkoutDate}
                </p>
                <div className="booking-card__element-wrapper">
                    <p>
                        <FontAwesomeIcon icon={faBed} />
                        {nights} {t("calendar.nights")}</p>
                    <p>
                        <FontAwesomeIcon icon={faArrowsToCircle} />
                        {booking.channel.name}
                    </p>
                </div>
            </div>
            <div className="booking-card__grid">
                <p>
                    <FontAwesomeIcon icon={faUser} />
                    {booking.client.name}
                </p>

                <div className="booking-card__element-wrapper">
                    <p>
                        <FontAwesomeIcon icon={faBuilding} />
                        {booking.apartment.name}
                    </p>
                    <p>
                        <FontAwesomeIcon icon={faUsers} />
                        {personCount}
                    </p>
                </div>
            </div>
        </div>
    )
}

const memoizedBooking = memo(BookingCard)

export default memoizedBooking