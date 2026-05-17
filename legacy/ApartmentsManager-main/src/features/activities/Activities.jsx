import { useTranslation } from "react-i18next";
import useTitle from '../../hooks/useTitle';
import Header from '../../components/Header';
import HeaderImage from "../../assets/images/sight_manresa_07.jpg";
import { activities } from "../../config/data";
import "./activities.css";

const Activities = () => {
    const { t } = useTranslation(['translation']);
    useTitle(t("nav.activities"));
    
    return (
        <>
            <Header title={t("nav.activities")} image={HeaderImage} />
            <section className="content-grid">
                {activities.map(({ name, bg, text }) => (
                    <div className="activity-card__wrapper" key={name}>
                        <div
                            className="activity-card__image"
                            style={{ backgroundImage: `url(${bg})` }}
                        />
                        <div className="activity-card__text">
                            <h1>{name}</h1>
                            <p>{text}</p>
                        </div>
                    </div>
                ))}
            </section>
        </>
    );
};

export default Activities;
