import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Header from '../../components/Header';
import HeaderImage from "../../assets/images/Dormitorio 2.jpg";
import useTitle from '../../hooks/useTitle';
import './contact-us.css';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useTranslation } from "react-i18next";

const EMAIL = process.env.REACT_APP_EMAIL;
const PHONE = process.env.REACT_APP_PHONE;

const formatPhoneNumber = (phoneNumber) => {
  // Remove spaces and parentheses from the phone number
  return phoneNumber.replace(/\s/g, '').replace(/[()]/g, '');
};
const ContactUs = () => {
  const { t } = useTranslation(["translation"]);
  useTitle(t("nav.contact-us"));

  return (
    <>
    <Header title={t("nav.contact-us")} image={HeaderImage}>
    </Header>
    <section className="contact">
      <div className="container contact__container">
        <div className="contact__wrapper">
          <a href={`mailto:${EMAIL}`} target='_blank' rel="noreferrer noopener"><FontAwesomeIcon icon={faEnvelope}/> </a>
          <a href={`https://wa.me/${formatPhoneNumber(PHONE)}`} target='_blank' rel="noreferrer noopener"><FontAwesomeIcon icon={faWhatsapp}/> </a>
        </div>
      </div>
    </section>
    </>
  );
};

export default ContactUs;
