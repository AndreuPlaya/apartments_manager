import React, { useState } from 'react';
import { dayNames, monthNames } from '../../config/data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from 'react-i18next';
import "./bookings-calendar.css";
import BookingInfoCard from './BookingInfoCard';

const getNumberOfDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
}

const getFirstDayOfWeek = (year, month) => {
    return new Date(year, month, 1).getDay();
}

const range = (start, end) => {
    const length = Math.abs((end - start) / 1)
    const { result } = Array.from({ length }).reduce(({ result, current }) => (
        {
            result: [...result, current],
            current: current + 1
        }), { result: [], current: start })

    return result
}

const BookingsCalendar = ({ bookings, defaultDate }) => {
    const { t } = useTranslation(['translation']);
    const [currentMonth, setCurrentMonth] = useState(defaultDate.getMonth());
    const [currentYear, setCurrentYear] = useState(defaultDate.getFullYear());

    const [selectedBooking, setSelectedBooking] = useState(null);

    const nextMonth = () => {
        if (currentMonth < 11) {
            setCurrentMonth(prev => prev + 1)
        } else {
            setCurrentMonth(0)
            setCurrentYear(prev => prev + 1)
        }
    }

    const prevMonth = () => {
        if (currentMonth > 0) {
            setCurrentMonth(prev => prev - 1)
        } else {
            setCurrentMonth(11)
            setCurrentYear(prev => prev - 1)
        }
    }

    const handleSelection = (event) => {
        // event delegation
        if (event.target.id !== "booking"){
            setSelectedBooking(null)
            return
        }
        const bookingData = JSON.parse(event.target.getAttribute("data-booking"));
        setSelectedBooking(bookingData)
    }

    const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
    const daysInMonth = getNumberOfDaysInMonth(currentYear, currentMonth);

    // Calculate the number of days to display from the previous month
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Calculate the number of days to display from the next month
    const lastWeekDays = (7 - (daysInMonth + daysFromPrevMonth) % 7) % 7;
    const { entities } = bookings
    const apartments = {};

    Object.values(entities).forEach((booking) => {
        const apartmentName = booking.apartment.name;

        const bookingStartDate = new Date(booking.fromDate);
        bookingStartDate.setHours(0, 0, 0, 0); // Set time to midnight
        const bookingEndDate = new Date(booking.toDate);
        bookingEndDate.setHours(0, 0, 0, 0); // Set time to midnight

        const startFilterDate = new Date(currentYear, currentMonth - 1, 23);
        const endFilterDate = new Date(currentYear, currentMonth + 1, 7);
        // Check if the booking's end date is greater or equal to the start of the selected month
        // and if the booking's start date is less or equal to the end of the selected month

        if (!apartments[apartmentName]) {
            apartments[apartmentName] = {
                name: apartmentName,
                bookings: []
            };
        }
        if (
            (bookingEndDate >= startFilterDate && bookingStartDate <= endFilterDate) ||
            (bookingEndDate >= startFilterDate && bookingStartDate < startFilterDate) || // Check for overlap with previous month
            (bookingStartDate <= endFilterDate && bookingEndDate > endFilterDate) // Check for overlap with next month
        ) {
            apartments[apartmentName].bookings.push({
                id: booking._id,
                name: booking.client.name,
                phoneNumber: booking.client.phoneNumber,
                apartment: booking.apartment.name,
                channel: booking.channel.name,
                adults: booking.adultCount,
                children: booking.childrenCount,
                comment: `${booking.comment ? booking.comment : ''}`,
                start: bookingStartDate,
                end: bookingEndDate,
            });
        }
    });

    // Convert the apartments object into an array and sort by name
    const sortedApartments = Object.values(apartments).sort((a, b) => a.name.localeCompare(b.name));
    
    return (
        <>
            <div onClick={handleSelection} className="bookings-calendar__wrapper">
                <div className="bookings-calendar__header">
                    <button
                        type='button'
                        onClick={prevMonth}
                        disabled={false}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <p>{t(monthNames[currentMonth])} {currentYear}</p>
                    <button
                        type='button'
                        onClick={nextMonth}
                        disabled={false}
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
                <div className="bookings-calendar__body">
                    <div className="bookings-calendar__day-grid bookings-calendar__day-header">
                        {dayNames.map((day) =>
                            <p key={day}>{t(day).substring(0, 3)}</p>
                        )}
                    </div>
                    <div className="bookings-calendar__day-grid">
                        {range(1 - daysFromPrevMonth, daysInMonth + lastWeekDays + 1).map((day) => {
                            const date = new Date(currentYear, currentMonth, day);
                            const isPrevMonth = day <= 0;
                            const isNextMonth = day > daysInMonth;

                            let className = 'bookings-calendar__day';
                            if (isPrevMonth) className += ' bookings-calendar__day-prev';
                            if (isNextMonth) className += ' bookings-calendar__day-next';

                            return (
                                <div key={day} className={className}>
                                    <p id="day" data-date={date}>
                                        {date.getDate()}
                                    </p>
                                    {sortedApartments.map((apartment) => {
                                        const apartmentBookings = apartment.bookings.filter(
                                            (booking) =>
                                                booking.start <= date && date <= booking.end
                                        );

                                        return (
                                            <div className='bookings-calendar__apartment-cell-wrapper' key={apartment.name}>
                                                {apartmentBookings.map((booking) => {
                                                    const isStaying = booking.start <= date && date <= booking.end;
                                                    const isSecondDay = date.getTime() === booking.start.getTime() + 24 * 60 * 60 * 1000;
                                                    const isIncoming = booking.start.getTime() === date.getTime();
                                                    const isLeaving = booking.end.getTime() === date.getTime();
                                                    const nights = new Date(booking.end - booking.start).getDate() - 1;
                                                    const isFirstDayOfWeek = date.getDay() === 1;
                                                    const isSecondDayOfWeek = date.getDay() === 2;
                                                    const displayName = (isSecondDay && !isFirstDayOfWeek )  
                                                    || (isSecondDayOfWeek && !isIncoming && !isLeaving) 
                                                    || (isFirstDayOfWeek && nights <3 && !isIncoming && !isLeaving);
                                                    const isDoubleBookingDay = apartmentBookings
                                                        .filter(otherBooking => otherBooking.id !== booking.id)
                                                        .some(otherBooking => (otherBooking.start.getTime() === date.getTime()) || (otherBooking.end.getTime() === date.getTime()));

                                                    let className = 'bookings-calendar__booking-cell';

                                                    if (isDoubleBookingDay) className += ' double-booking'

                                                    if (isIncoming) className += ' incoming'
                                                    else if (isLeaving) className += ' leaving'
                                                    else if (isStaying) className += ' staying'

                                                    return (
                                                        <>
                                                        <div
                                                            key={booking.id}
                                                            id="booking"
                                                            data-booking={JSON.stringify(booking)}
                                                            className={className}
                                                        >
                                                            
                                                            {displayName && <div className="bookings-calendar__client-name">{booking.name.toUpperCase()}</div> }
                                                        </div>
                                                        </>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
            <BookingInfoCard booking={selectedBooking}/>
        </>
    )
}

export default BookingsCalendar;
