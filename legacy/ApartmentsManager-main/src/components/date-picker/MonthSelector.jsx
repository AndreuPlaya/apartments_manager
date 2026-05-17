import React, {useState, useEffect} from 'react';
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { monthNames } from '../../config/data';
import "./date-picker.css"
const MonthSelector = ({ defaultDate, minDate, maxDate, onChange }) => {

    const { t } = useTranslation(["translation"]);
    const [currentMonth, setCurrentMonth] = useState(defaultDate.getMonth());
    const [currentYear, setCurrentYear] = useState(defaultDate.getFullYear());

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

    useEffect(() => {
        const selectedDate = new Date(Date.UTC(currentYear, currentMonth, 1));
        onChange(selectedDate);
    }, [currentMonth, currentYear]);

    return (
        <div className="month-picker">
            <button type='button' onClick={prevMonth} disabled={minDate && new Date(currentYear, currentMonth, 1) <= minDate}>
                <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <p>{t(monthNames[currentMonth])} {currentYear}</p>
            <button type='button' onClick={nextMonth} disabled={maxDate && new Date(currentYear, currentMonth + 1, 0) >= maxDate}>
                <FontAwesomeIcon icon={faChevronRight} />
            </button>
        </div>
    );
}

export default MonthSelector;
