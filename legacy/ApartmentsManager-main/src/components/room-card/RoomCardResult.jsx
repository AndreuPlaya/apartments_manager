import React from 'react';
import { useTranslation } from "react-i18next"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBathtub, faBed, faChevronRight, faDoorOpen, faUsers } from "@fortawesome/free-solid-svg-icons";
import "./room-card-result.css"

const RoomCard = ({ room }) => {
    const { t } = useTranslation(['translation']);
    return (
        <div className="room-card">
            <div
                className="room-card__image"
                style={{ backgroundImage: `url(${room.bg})` }}
            >
            </div>

            <div className="room-card__description">
                <div className=".room-card__description-column">

                    <div className=".room-card__description-row">
                        <div className="room-card__title">
                            {room.name}
                        </div>
                        <div className="room-card__features">
                            <p><FontAwesomeIcon icon={faDoorOpen} /> {room.rooms} {t("room-card.rooms")}</p>
                            <p><FontAwesomeIcon icon={faBathtub} /> {room.bathrooms} {t("room-card.bathrooms")}</p>
                            <p><FontAwesomeIcon icon={faUsers} /> {room.maxGuests} {t("room-card.guests")}</p>
                        </div>
                    </div>
                    <div className=".room-card__description-row">
                        <div className="room-card__text">
                            {room.description}
                        </div>
                    </div>


                </div>
                <div className=".room-card__description-column">

                    <div className=".room-card__description-row">
                    </div>
                    <div className=".room-card__description-row">
                        <div className="room-card__cta">
                            <div className="room-card__total-people">
                                {room.total}€
                            </div>
                            <div className="room-card__total-price">
                                {room.total}€
                            </div>
                            <button
                                type="submit"
                                formMethod='POST'
                            >
                                {t("room-card.book-now")} <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomCard;
