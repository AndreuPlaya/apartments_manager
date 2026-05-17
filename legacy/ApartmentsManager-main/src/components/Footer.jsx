import { Link } from "react-router-dom"
import Logo from '../assets/logo.svg'
import { headerLinks,footerLinks, languages } from '../config/data'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub, faLinkedin, faYoutube } from "@fortawesome/free-brands-svg-icons"
import { useTranslation } from 'react-i18next';
import './footer.css'

const Footer = () => {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (event) => {
        const selectedLanguage = event.target.value;
        i18n.changeLanguage(selectedLanguage);
    };

    const currentLanguage = i18n.language.split('-')[0];
    
    return (

        <footer className="footer">
            <div className="container footer__container">
                <div className="footer__container-top">
                    <article>
                        <Link to="/" className='logo'>
                            <img src={Logo} alt="Footer Logo" />
                        </Link>
                    </article>
                    <article>
                        <h4>Links</h4>
                        <ul className='footer__links'>
                            {
                                headerLinks.map(({ name, path }, index) => {
                                    return (
                                        <li key={index}>
                                            <Link
                                                to={path}>
                                                {t(name)}
                                            </Link>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </article>
                    <article>
                        <h4>More Links</h4>
                        <ul className='footer__links'>
                            {
                                footerLinks.map(({ name, path }, index) => {
                                    return (
                                        <li key={index}>
                                            <Link
                                                to={path}>
                                                {t(name)}
                                            </Link>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </article>
                </div>
                <div className="footer__container-bottom">
                    <div className="copyright">
                        © 2023 {process.env.REACT_APP_COMPANY_NAME}.{t('footer.rights-reserved')}.
                    </div>
                    <select
                        className="language"
                        value={currentLanguage}
                        onChange={handleLanguageChange}
                    >
                        {languages.map(({ value, name }, index) => (
                            <option
                                key={index}
                                value={value}
                            >
                                {`(${value.toLocaleUpperCase()}) ${name}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </footer>
    )
}

export default Footer