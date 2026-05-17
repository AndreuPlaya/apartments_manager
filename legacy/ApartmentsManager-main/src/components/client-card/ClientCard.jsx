import { useNavigate } from 'react-router-dom'
import { memo } from 'react'
import { useTranslation } from "react-i18next";
import "./client-card.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faIdCard, faPhone, faUser } from '@fortawesome/free-solid-svg-icons';

const ClientCard = ({ client }) => {
    const navigate = useNavigate()
    const { t } = useTranslation(["translation"])
    if (!client) return null

    const handleEdit = () => {
        navigate(`/private/clients/${client.id}`)
    }

    return (
        <div className="client-card__wrapper" onClick={handleEdit}>
            <div className="client-card__grid">
                <p>
                    <FontAwesomeIcon icon={faUser} />
                    {client.name}
                </p>
                {client.identityDocument ? (
                    <p>
                        <FontAwesomeIcon icon={faIdCard} />
                        {client.identityDocument}
                    </p>
                ) : (
                    <p className='missing-data'>
                        <FontAwesomeIcon icon={faIdCard} />
                        {t("private.identity-document")}
                    </p>
                )}
                {client.email ? (
                    <p>
                        <FontAwesomeIcon icon={faEnvelope} />
                        {client.email}
                    </p>
                ) : (
                    <p className='missing-data'>
                        <FontAwesomeIcon icon={faEnvelope} />
                        {t("private.email")}
                    </p>
                )}
                {client.phoneNumber ? (
                    <p>
                        <FontAwesomeIcon icon={faPhone} />
                        {client.phoneNumber}
                    </p>
                ) : (
                    <p className='missing-data'>
                        <FontAwesomeIcon icon={faPhone} />
                        {t("private.phone-number")}
                    </p>
                )}
            </div>
        </div>
    )
}

const memoizedClient = memo(ClientCard)

export default memoizedClient