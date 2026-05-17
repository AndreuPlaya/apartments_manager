import React, { useState, useEffect } from 'react';
import { dayNames } from '../../config/data';
import { useTranslation } from 'react-i18next';
import MonthSelector from './MonthSelector'
import "./date-picker.css";

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

const DatePicker = ({ minDate, maxDate, onDateChange, defaultDate }) => {
    const { t } = useTranslation(['translation']);
    const [currentMonth, setCurrentMonth] = useState(defaultDate.getMonth());
    const [currentYear, setCurrentYear] = useState(defaultDate.getFullYear());
    const [selectedDate, setSelectedDate] = useState(new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate()));

    useEffect(() => {
        setCurrentMonth(defaultDate.getMonth())
        setCurrentYear(defaultDate.getFullYear())
        setSelectedDate(new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate()));
    }, [defaultDate]);

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

   const onMonthPickerChange= (date) =>{
        setCurrentMonth(date.getMonth())
        setCurrentYear(date.getFullYear())
   }
    const handleSelection = (event) => {
        // event delegation
        if (event.target.id !== "day")
            return
        var date = new Date(event.target.getAttribute("data-date"))
        var formattedDate = new Date( date.getFullYear(), date.getMonth(), date.getDate())
        if (minDate?.getTime() > formattedDate.getTime())
            return

        setSelectedDate(formattedDate)

        if (onDateChange) {
            onDateChange(formattedDate);
        }

        if (formattedDate.getTime() < new Date(currentYear, currentMonth, 1))
            prevMonth()
        else if (formattedDate.getTime() > new Date(currentYear, currentMonth, daysInMonth))
            nextMonth()
    }


    const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
    const daysInMonth = getNumberOfDaysInMonth(currentYear, currentMonth);

    // Calculate the number of days to display from the previous month
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Calculate the number of days to display from the next month
    const lastWeekDays = (7 - (daysInMonth + daysFromPrevMonth) % 7) % 7;

    return (
        <div className="date-picker__wrapper">
            <MonthSelector defaultDate={defaultDate} minDate={minDate} maxDate={maxDate} onChange={onMonthPickerChange}/>
            <div className="date-picker__body">
                <div className="date-picker__day-grid date-picker__day-header">
                    {dayNames.map((day) =>
                        <p key={day}>{t(day).substring(0, 3)}</p>
                    )}
                </div>
                <div onClick={handleSelection} className="date-picker__day-grid">
                    {/* Display previous month days */}
                    {range(
                        daysInMonth - daysFromPrevMonth,
                        daysInMonth
                    ).map((day, index) => {
                        const date = new Date(currentYear, currentMonth, 1);
                        date.setDate(date.getDate() - daysFromPrevMonth + index);
                        return (
                            <p
                                type='button'
                                key={day}
                                id="day"
                                data-date={date}
                                className={
                                    `date-picker__day-prev 
                                    ${selectedDate?.getTime() === date.getTime() ? 'active' : ''}
                                    ${(minDate?.getTime() > date.getTime()) || (maxDate?.getTime() < date.getTime()) ? 'disabled' : ''}
                                    `}>
                                {date.getDate()}
                            </p>
                        )
                    }
                    )}

                    {/* Display current month days */}
                    {range(1, daysInMonth + 1).map((day) => {
                        const date = new Date(currentYear, currentMonth, day);
                        return (
                            <p
                                type='button'
                                key={day}
                                id="day"
                                data-date={date}
                                className={
                                    `date-picker__day
                                    ${selectedDate?.getTime() === date.getTime() ? 'active' : ''}
                                    ${(minDate?.getTime() > date.getTime()) || (maxDate?.getTime() < date.getTime()) ? 'disabled' : ''}
                                    `}>
                                {date.getDate()}
                            </p>
                        )
                    }
                    )}

                    {/* Display next month days */}
                    {range(1, lastWeekDays + 1).map((day) => {
                        const date = new Date(currentYear, currentMonth, daysInMonth);
                        date.setDate(date.getDate() + day);
                        return (
                            <p
                                type='button'
                                key={day}
                                id="day"
                                data-date={date}
                                className={
                                    `date-picker__day-next 
                                    ${selectedDate?.getTime() === date.getTime() ? 'active' : ''}
                                    ${(minDate?.getTime() > date.getTime()) || (maxDate?.getTime() < date.getTime()) ? 'disabled' : ''}
                                    `}>
                                {date.getDate()}
                            </p>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default DatePicker;
