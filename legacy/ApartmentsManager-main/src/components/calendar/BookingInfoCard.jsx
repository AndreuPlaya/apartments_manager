import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { monthNames } from '../../config/data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faEdit, faPhone, faXmarkSquare } from '@fortawesome/free-solid-svg-icons';
import "./booking-info-card.css"
import { Link } from 'react-router-dom';

const BookingInfoCard = ({ booking }) => {
    const { t } = useTranslation(['translation']);
    const [isVisible, setIsVisible] = useState(true)
    const startDate = new Date(booking?.start);
    const endDate = new Date(booking?.end);
    const checkinDate = `${startDate.getDate()} ${t(monthNames[startDate.getMonth()]).substring(0, 3).toLowerCase()} ${startDate.getFullYear()}`
    const checkoutDate = `${endDate.getDate()} ${t(monthNames[endDate.getMonth()]).substring(0, 3).toLowerCase()} ${endDate.getFullYear()}`
    const nights = new Date(endDate - startDate).getDate() - 1
    useEffect(() => {
        setIsVisible(true);
    }, [booking]);
    const closeCard = () => {
        setIsVisible(false);
    };
    const toggleVisibility = (event) => {
        if (event.target.id !== "wrapper")
            return
        setIsVisible(!isVisible);
    };

    if (!booking) return
    return (
        <div id="wrapper" className={`booking-info-card__wrapper ${isVisible ? '' : ' hidden'}`} onClick={toggleVisibility}>
            <div className="booking-info-card__container">
                <div className="booking-info-card__header">
                    <Link to={`/private/bookings/${booking.id}`}><FontAwesomeIcon icon={faEdit} /></Link>
                    <div onClick={closeCard}><FontAwesomeIcon icon={faXmarkSquare} /></div>
                </div>
                <div className="booking-info-card__guest">
                    <h2>{booking.name.toUpperCase()}</h2>
                    {booking.phoneNumber && <h3><FontAwesomeIcon icon={faPhone} />{booking.phoneNumber}</h3>}
                </div>
                <div className="booking-info-card__extras">
                    <p>{booking.apartment}</p>
                    <p>{booking.channel}</p>
                </div>
                <div className="booking-info-card__dates">
                    <p>{checkinDate}</p>
                    <p><FontAwesomeIcon icon={faArrowRight} /></p>
                    <p>{checkoutDate}</p>
                </div>
                <div className="booking-info-card__value-cards">
                    <div className="booking-info-card__value-card">
                        <div className="booking-info-card__value-card-number">
                            {booking.adults}
                        </div>
                        <div className="booking-info-card__value-card-text">
                            {t("calendar.adults")}
                        </div>
                    </div>
                    <div className="booking-info-card__value-card">
                        <div className="booking-info-card__value-card-number">
                            {booking.children}
                        </div>
                        <div className="booking-info-card__value-card-text">
                            {t("calendar.children")}
                        </div>
                    </div>
                    <div className="booking-info-card__value-card">
                        <div className="booking-info-card__value-card-number">
                            {nights}
                        </div>
                        <div className="booking-info-card__value-card-text">
                            {t("calendar.nights")}
                        </div>
                    </div>
                </div>
                <div className="booking-info-card__comment">
                    <p>{booking.comment}</p>
                </div>
            </div>
        </div>
    )
}

export default BookingInfoCard