import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { useSendLogoutMutation } from '../features/auth/authApiSlice'
import { NavLink } from 'react-router-dom'
import { privateLinks } from '../config/data'
import { useTranslation } from 'react-i18next'
import {faChevronLeft, faChevronRight, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './side-menu.css'
import LoadingSpinner from './LoadingSpinner';
import useAuth from '../hooks/useAuth'

const SideMenu = () => {
    const { roles } = useAuth();
    const [isNavShowing, setIsNavShowing] = useState(false);
    const { t } = useTranslation(["translation"])
    const navigate = useNavigate()

    const [sendLogout, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useSendLogoutMutation()

    useEffect(() => {
        if (isSuccess) navigate('/')
    }, [isSuccess, navigate])

    const errContent = error?.data?.message ?? "";

    const errClass = isError ? "errmsg" : "offscreen"

    if (!roles?.length) return;

    if (isLoading) return <LoadingSpinner />

    return (
        <>
            <p className={errClass}>{errContent}</p>
            <div className="side__menu">
                <div className={`side__menu-container ${isNavShowing ? 'show__side-menu' : 'hide__side-menu'}`}>
                    <button className={`side__menu-toggle-btn ${isNavShowing ? 'show__side-menu' : 'hide__side-menu'}`} onClick={() => setIsNavShowing(prev => !prev)}>
                        {
                            isNavShowing ? <FontAwesomeIcon icon={faChevronLeft} /> : <FontAwesomeIcon icon={faChevronRight} />
                        }
                    </button>
                    <ul className={'side__menu-links'}>
                        {
                            privateLinks
                                .filter(link => roles.some(role => link.access.includes(role)))
                                .map(({ name, path, icon }, index) => {
                                    return (
                                        <li key={index}>
                                            <NavLink
                                                to={path}
                                                className={({ isActive }) => (isActive ? 'side__menu-link side__menu-active-nav' : 'side__menu-link')}
                                                onClick={() => setIsNavShowing(prev => !prev)}>
                                                <p className='side-menu__icon'>{icon}</p>
                                                <p className='side-menu__text'>{t(name)}</p>
                                            </NavLink>
                                        </li>
                                    )
                                })
                        }
                        <li>
                            <NavLink
                                to='/'
                                className='side__menu-link'
                                onClick={() => sendLogout()}>
                                <p className='side-menu__icon'><FontAwesomeIcon icon={faRightFromBracket} /> </p>
                                <p className={`side-menu__text ${isNavShowing ? 'show__side-menu' : 'hide__side-menu'}`}>{t("nav.log-out")}</p>
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    )
}

export default SideMenu