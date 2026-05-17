import { useNavigate } from 'react-router-dom'
import { memo } from 'react'
import { useTranslation } from "react-i18next";
import "./user-card.css"
import { faEnvelope, faIdCardClip, faPencilRuler, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const UserCard = ({ user }) => {
    const navigate = useNavigate()
    const { t } = useTranslation(["translation"])
    if (!user) return null

    const handleEdit = () => {
        navigate(`/private/users/${user.id}`)
    }

    const userRolesString = user.roles.toString().replaceAll(',', ', ')

    return (
        <div className="user-card__wrapper" onClick={handleEdit}>
            <div className="user-card__grid">
                <p>
                    <FontAwesomeIcon icon={faUser} />
                    {user.username}
                </p>
                <p>
                    <FontAwesomeIcon icon={faIdCardClip} />
                    {userRolesString}
                </p>
                {user.email ? (
                    <p>
                        <FontAwesomeIcon icon={faEnvelope} />
                        {user.email}
                    </p>
                ) : (
                    <p className='missing-data'>
                        <FontAwesomeIcon icon={faEnvelope} />
                        {t("private.email")}
                    </p>
                )}
                <p>
                    <FontAwesomeIcon icon={faPencilRuler} />
                    {user.active ? "Active" : "Disabled"}
                </p>

            </div>
        </div>
    )
}

const memoizedUser = memo(UserCard)

export default memoizedUser