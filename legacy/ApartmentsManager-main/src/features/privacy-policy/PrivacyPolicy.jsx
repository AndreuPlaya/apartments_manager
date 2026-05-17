import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header'
import HeaderImage from "../../assets/images/Dormitorio 2.jpg"
import useTitle from '../../hooks/useTitle';

const PrivacyPolicy = () => {
  const { t } = useTranslation(['translation']);
  useTitle(t('nav.privacy-policy'));

  const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME;
  const COMPANY_ADDRESS = process.env.REACT_APP_COMPANY_ADDRESS;
  const COMPANY_CITY = process.env.REACT_APP_COMPANY_CITY;
  const COMPANY_STATE = process.env.REACT_APP_COMPANY_STATE;
  const COMPANY_ZIPCODE = process.env.REACT_APP_COMPANY_ZIPCODE;
  const EMAIL = process.env.REACT_APP_EMAIL;
  const PHONE = process.env.REACT_APP_PHONE;

  return (
    <>
      <Header title={t("nav.privacy-policy")} image={HeaderImage} />
      <main className="content-grid">
          <section className="privacy__policy-main full-width">
            <h1>{t('privacy-policy.privacy-policy')}</h1>
            <p>{t('privacy-policy.privacy-policy-p', { COMPANY_NAME })}</p>
          </section>
          <div className="privacy__policy-collect">
            <h2>{t('privacy-policy.information-we-collect')}</h2>
            <p>{t('privacy-policy.information-we-collect-p')}</p>
            <ul>
              <li>{t('privacy-policy.information-we-collect-li1')}</li>
              <li>{t('privacy-policy.information-we-collect-li2')}</li>
              <li>{t('privacy-policy.information-we-collect-li3')}</li>
              <li>{t('privacy-policy.information-we-collect-li4')}</li>
              <li>{t('privacy-policy.information-we-collect-li5')}</li>
              <li>{t('privacy-policy.information-we-collect-li6')}</li>
            </ul>
          </div>
          <div className="privacy__policy-use">
            <h2>{t('privacy-policy.how-we-use-your-information')}</h2>
            <p>{t('privacy-policy.how-we-use-your-information-p')}</p>
            <ul>
              <li>{t('privacy-policy.how-we-use-your-information-li1')}</li>
              <li>{t('privacy-policy.how-we-use-your-information-li2')}</li>
              <li>{t('privacy-policy.how-we-use-your-information-li3')}</li>
              <li>{t('privacy-policy.how-we-use-your-information-li4')}</li>
              <li>{t('privacy-policy.how-we-use-your-information-li5')}</li>
            </ul>
          </div>
          <div className="privacy__policy-sharing">
            <h2>{t('privacy-policy.information-sharing-and-disclosure')}</h2>
            <p>{t('privacy-policy.information-sharing-and-disclosure-p1')}</p>
            <p>{t('privacy-policy.information-sharing-and-disclosure-p2')}</p>


            <ul>
              <li>{t('privacy-policy.information-sharing-and-disclosure-li1')}</li>
              <li>{t('privacy-policy.information-sharing-and-disclosure-li2')}</li>
              <li>{t('privacy-policy.information-sharing-and-disclosure-li3')}</li>
              <li>{t('privacy-policy.information-sharing-and-disclosure-li4')}</li>
            </ul>
          </div>
          <div className="privacy__policy-security">
            <h2>{t('privacy-policy.security')}</h2>
            <p>{t('privacy-policy.security-p')}</p>

          </div>
          <div className="privacy__policy-choices">
            <h2>{t('privacy-policy.your-choices')}</h2>
            <p>{t('privacy-policy.your-choices-p')}</p>

          </div>
          <div className="privacy__policy-contact-us">
            <h2>{t('privacy-policy.contact-us')}</h2>
            <p>{t('privacy-policy.contact-us-p')}</p>

            <ul>
              <li>{COMPANY_NAME}</li>
              <li>{COMPANY_ADDRESS}</li>
              <li>{`${COMPANY_CITY}, ${COMPANY_STATE}, ${COMPANY_ZIPCODE}`}</li>
              <li>{EMAIL}</li>
              <li>{PHONE}</li>
            </ul>
          </div>
      </main >
    </>
  );
};

export default PrivacyPolicy;
