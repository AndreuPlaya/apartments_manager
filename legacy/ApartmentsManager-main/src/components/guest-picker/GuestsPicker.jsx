import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import "./guest-picker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinusCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const GuestsPicker = ({ onAdultsChange, defaultAdults, onChildrenChange, defaultChildren }) => {
    const { t } = useTranslation(['translation']);
    const [adults, setAdults] = useState(defaultAdults);
    const [children, setChildren] = useState(defaultChildren);
    const maxAdults = 6
    const maxChildren = 6
    const minAdults = 1
    const minChildren = 0
    
    useEffect(() => {
        setAdults(defaultAdults);
    }, [defaultAdults]);

    useEffect(() => {
        setChildren(defaultChildren);
    }, [defaultChildren]);

    const handleAdultsIncrease = () => {
        if (adults >= maxAdults)
            return
        const newAdults = adults + 1;
        setAdults(newAdults);
        if (onAdultsChange) {
            onAdultsChange(newAdults);
        }
    };

    const handleAdultsDecrease = () => {
        if (adults <= minAdults)
            return

        const newAdults = adults - 1;
        setAdults(newAdults);
        if (onAdultsChange) {
            onAdultsChange(newAdults);
        }
    };

    const handleChildrenIncrease = () => {
        if (children >= maxChildren)
            return

        const newChildren = children + 1;
        setChildren(newChildren);
        if (onChildrenChange) {
            onChildrenChange(newChildren);
        }
    };

    const handleChildrenDecrease = () => {
        if (children <= minChildren)
            return

        const newChildren = children - 1;
        setChildren(newChildren);
        if (onChildrenChange) {
            onChildrenChange(newChildren);
        }

    };

    return (
        <div className="guest-picker__wrapper">
            <div className="guest-picker__selector">
                <p>{t("searchbar.adults")}</p>
                <p><FontAwesomeIcon
                    icon={faMinusCircle}
                    onClick={handleAdultsDecrease}
                    className={adults <= minAdults ? "disabled" : "enabled"}
                />
                </p>

                <p>{adults}</p>
                <p><FontAwesomeIcon
                    icon={faPlusCircle}
                    onClick={handleAdultsIncrease}
                    className={adults >= maxAdults ? "disabled" : "enabled"}
                />
                </p>
            </div>
            <div className="guest-picker__selector">
                <p>{t("searchbar.children")}</p>
                <p><FontAwesomeIcon
                    icon={faMinusCircle}
                    onClick={handleChildrenDecrease}
                    className={children <= minChildren ? "disabled" : "enabled"}
                />
                </p>
                <p>{children}</p>
                <p><FontAwesomeIcon
                    icon={faPlusCircle}
                    onClick={handleChildrenIncrease}
                    className={children >= maxChildren ? "disabled" : "enabled"}
                />
                </p>
            </div>
        </div>
    );
};

export default GuestsPicker;
