import React from 'react'
import { useCookies } from 'react-cookie'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom';

function CookieConsent() {
    const [cookies, setCookie] = useCookies(["cookieConsent"])
    const { t } = useTranslation(['translation']);

    const giveCookieConsent = () => {
        setCookie("cookieConsent", true, { path: "/" })
    }

    return (
        <div className="content-grid cookie-consent__wrapper">
            <div className="cookie-consent__text">
                <p>{t("cookie.consent")}</p>
                <Link to="privacy-policy">{t("cookie.cta")}</Link>
            </div>
            <button className='btn lg' onClick={giveCookieConsent}>
                {t("cookie.accept")}
            </button>
        </div>
    )
}

export default CookieConsent