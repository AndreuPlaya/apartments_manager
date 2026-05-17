import React, { useState, useEffect } from 'react';
import DatePicker from "../date-picker/DatePicker"
import { dayNames, monthNames } from '../../config/data';
import { useTranslation } from 'react-i18next';
import "./input-buttons.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

function CalendarInput({ id, className, label, onSelection, minDate, defaultDate }) {
    const { t } = useTranslation(['translation']);
    const [date, setDate] = useState(new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate()));
    const [isChildrenVisible, setChildrenVisible] = useState(false);

    useEffect(() => {
        setDate(new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate()));
    }, [defaultDate]);

    const getDateStringFromDate = (date) => {
        return `${t(dayNames[(date.getDay() + 6) % 7]).toLocaleUpperCase()} ${date.getDate()} ${t(monthNames[date.getMonth()]).toLocaleUpperCase().substring(0, 3)} ${date.getFullYear()}`;
    };

    const handleDateChange = (date) => {
        setChildrenVisible(false);
        setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        onSelection(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    };
    
    const toggleVisibility = () => {
        setChildrenVisible(!isChildrenVisible);
    };

    return (
        <div className={`input__wrapper ${!className ? "" : className}`}>
            {label && (
                <label htmlFor={id}>
                    {label}
                </label>
            )}
            <div className="input__value pointer" onClick={toggleVisibility}>
                <p>{getDateStringFromDate(date)}</p>
                <p>{isChildrenVisible ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />} </p>
            </div>
            <div className={`input__children ${isChildrenVisible ? "visible" : "not-visible"}`}>
                <DatePicker
                    minDate={minDate}
                    onDateChange={handleDateChange}
                    defaultDate={date}
                />
            </div>
        </div>
    )
}

export default CalendarInput;
