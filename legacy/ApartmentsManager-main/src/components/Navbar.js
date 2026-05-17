import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom'
import { headerLinks } from '../config/data'
import { useTranslation } from 'react-i18next'
import Logo from '../assets/logo.svg'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './navbar.css'

const Navbar = () => {
    const [isNavShowing, setIsNavShowing] = useState(false);
    const { t } = useTranslation(["translation"])
    return (
        <nav>
            <div className="container nav__container">
                <div className="logo__container">
                    <Link
                        to='/'
                        className='logo'
                        onClick={() => setIsNavShowing(false)}>
                        <img src={Logo} alt='Nav Logo' />
                    </Link>
                    <Link
                        to='/'
                        className='logo__text'
                        onClick={() => setIsNavShowing(false)}>
                        {process.env.REACT_APP_NAME}
                    </Link>
                </div>
                <ul className={`nav__links ${isNavShowing ? 'show_nav' : 'hide__nav'}`}>
                    {
                        headerLinks.map(({ name, path }, index) => {
                            return (
                                <li key={index}>
                                    <NavLink
                                        to={path}
                                        key={index}
                                        className={({ isActive }) => (isActive ? 'active-nav' : '')}
                                        onClick={() => setIsNavShowing(prev => !prev)}
                                    >
                                        {t(name)}
                                    </NavLink>
                                </li>
                            )
                        })
                    }
                </ul>
                <button className="nav__toggle-btn" onClick={() => setIsNavShowing(prev => !prev)}>
                    {
                        isNavShowing ? <FontAwesomeIcon icon={faXmark} /> : <FontAwesomeIcon icon={faBars} />
                    }

                </button>
            </div>
        </nav>
    )
}

export default Navbar