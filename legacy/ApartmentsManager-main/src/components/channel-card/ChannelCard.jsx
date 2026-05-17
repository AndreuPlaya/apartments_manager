import { useNavigate } from 'react-router-dom'
import { memo } from 'react'
import { useTranslation } from "react-i18next";
import "./channel-card.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsToCircle, faHandHoldingUsd, faPercent } from '@fortawesome/free-solid-svg-icons';

const ChannelCard = ({ channel }) => {
    const navigate = useNavigate()
    const { t } = useTranslation(["translation"])
    if (!channel) return null

    const handleEdit = () => {
        navigate(`/private/channels/${channel.id}`)
    }

    return (
        <div className="channel-card__wrapper" onClick={handleEdit}>
            <div className="channel-card__grid">
                <p><FontAwesomeIcon icon={faArrowsToCircle} />{channel.name}</p>
                <p><FontAwesomeIcon icon={faHandHoldingUsd} />{channel.commissionRate}<FontAwesomeIcon icon={faPercent} /></p>
            </div>
        </div>
    )
}

const memoizedChannel = memo(ChannelCard)

export default memoizedChannel