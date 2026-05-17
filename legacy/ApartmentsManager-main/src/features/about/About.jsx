import { useTranslation } from "react-i18next"
import useTitle from '../../hooks/useTitle'
import Header from '../../components/Header'
import HeaderImage from "../../assets/images/sight_manresa_03.jpg"
import "./about.css"
const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME;

const About = () => {
  const { t } = useTranslation(['translation']);
  useTitle(t("nav.about"));

  return (
    <>
      <Header title={t("nav.about")} image={HeaderImage}/>
      <section className="about">
      <div className="container about-container">
        <div className="about-section">
          <h2>{t("about-us.main-title")}</h2>
          <p>{t("about-us.main-paragraph", { COMPANY_NAME })}</p>
        </div>
        <div className="about-section">
          <h2>{t("about-us.out-team-title")}</h2>
          <p>{t("about-us.out-team-paragraph", { COMPANY_NAME })}</p>
        </div>
        <div className="about-section">
          <h2>{t("about-us.out-mission-title")}</h2>
          <p>{t("about-us.out-mission-paragraph", { COMPANY_NAME })}</p>
        </div>
      </div>
      </section>
    </>
    
  )
};

export default About;