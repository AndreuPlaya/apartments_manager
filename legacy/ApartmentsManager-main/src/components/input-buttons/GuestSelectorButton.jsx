import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GuestsPicker from "../guest-picker/GuestsPicker";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from 'react-i18next';


function GuestSelectorButton({ id, className, label, defaultAdults, defaultChildren, onAdultsChange, onChildrenChange, disabled }) {
    const { t } = useTranslation(['translation']);
    const getGuestsString = (adults, children) => {
        let guestString = `${adults} ${t('searchbar.adults').toLocaleUpperCase()}`
        if (children > 0) guestString += ` | ${children} ${t('searchbar.children').toLocaleUpperCase()}`
        return guestString
    };
    const [adultCount, setAdultCount] = useState(defaultAdults);
    const [childrenCount, setChildrenCount] = useState(defaultAdults);
    const [guestString, setGuestString] = useState(getGuestsString(defaultAdults, defaultChildren))
    const [isChildrenVisible, setChildrenVisible] = useState(false);
    
    useEffect(() => {
        setAdultCount(defaultAdults);
        setGuestString(getGuestsString(defaultAdults, childrenCount));
    }, [defaultAdults]);

    useEffect(() => {
        setChildrenCount(defaultChildren);
        setGuestString(getGuestsString(adultCount, defaultChildren));
    }, [defaultChildren]);

    const handleAdultsChange = (count) => {
        setAdultCount(count);
        onAdultsChange(count)
        setGuestString(getGuestsString(count, childrenCount));
    };

    const handleChildrenChange = (count) => {
        setChildrenCount(count);
        onChildrenChange(count)
        setGuestString(getGuestsString(adultCount, count));
    };

    const toggleVisibility = () => {
        if (disabled) return
        setChildrenVisible(!isChildrenVisible);
    };

    return (
        <div className={`input__wrapper ${className}`}>
            {label && (
                <label htmlFor={id}>
                    {label}
                </label>
            )}
            <div className="input__value pointer" onClick={toggleVisibility}>
                <p>{guestString}</p>
                <p>{isChildrenVisible ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />} </p>
            </div>
            <div className={`input__children ${isChildrenVisible ? "visible" : "not-visible"}`}>
                <GuestsPicker
                    onAdultsChange={handleAdultsChange}
                    defaultAdults={adultCount}
                    onChildrenChange={handleChildrenChange}
                    defaultChildren={childrenCount}
                />
            </div>
        </div>
    );
}

export default GuestSelectorButton