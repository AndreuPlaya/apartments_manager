
import { useTranslation } from "react-i18next"
const Welcome = () => {
    const { t } = useTranslation(['translation']);

    return (
        <section className="welcome">
            <div className="container welcome__container">

                <div className="welcome__container-card">
                    <h2>{t('home.welcome-to-manresa')}</h2>
                    <p>{t('home.welcome-message')}</p>

                </div>
                <div
                    className="welcome__container-bg"
                    style={{ backgroundImage: "url(/assets/images/sight_manresa_02.jpg)" }}
                >
                </div>
            </div>
        </section>
    )
}




export default Welcome