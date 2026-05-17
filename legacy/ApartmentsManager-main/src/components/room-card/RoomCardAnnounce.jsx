import React from 'react';
import { useTranslation } from "react-i18next"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBathtub, faBed, faChevronRight, faDoorOpen, faUsers } from "@fortawesome/free-solid-svg-icons";


const RoomCard = ({ room }) => {
    const { t } = useTranslation(['translation']);
    return (
        <div className="room-card__wrapper">
            <div
                className="room-card__top"
                style={{ backgroundImage: `url(${room.bg})` }}
            >
            </div>
            <div className="room-card__price">
                {`${t("room-card.from")} ${room.price}€`}
            </div>
            <div className="room-card__bottom">
                <div className="room-card__name">
                    {room.name}
                </div>
                <div className="room-card__features">
                    <p><FontAwesomeIcon icon={faDoorOpen} /> {room.rooms} {t("room-card.rooms")}</p>
                    <p><FontAwesomeIcon icon={faBathtub} /> {room.bathrooms} {t("room-card.bathrooms")}</p>
                    <p><FontAwesomeIcon icon={faUsers} /> {room.maxGuests} {t("room-card.guests")}</p>
                </div>
                <div className="room-card__cta">
                    {t("room-card.book-now")}  <FontAwesomeIcon icon={faChevronRight} />
                </div>
            </div>

        </div>
    );
};

export default RoomCard;
