import { useNavigate } from 'react-router-dom'
import { memo } from 'react'
import { useTranslation } from "react-i18next";
import "./apartment-card.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faEur, faLocationDot, faMoon } from '@fortawesome/free-solid-svg-icons';

const ApartmentCard = ({ apartment }) => {
    const navigate = useNavigate()
    const { t } = useTranslation(["translation"])
    if (!apartment) return null

    const handleEdit = () => {
        navigate(`/private/apartments/${apartment.id}`)
    }

    return (
        <div className="apartment-card__wrapper" onClick={handleEdit}>
            <div className="apartment-card__grid">
                <p><FontAwesomeIcon icon={faBuilding} />{apartment.name}</p>
                <p><FontAwesomeIcon icon={faLocationDot} />{apartment.fullAddress}</p>
                <p><FontAwesomeIcon icon={faMoon} /> {apartment.price}<FontAwesomeIcon icon={faEur} /></p>
            </div>
        </div>
    )
}

const memoizedApartment = memo(ApartmentCard)

export default memoizedApartment