import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header'
import HeaderImage from "../../assets/images/Dormitorio 2.jpg"
import useTitle from '../../hooks/useTitle';

const LegalNotice = () => {
  const { t } = useTranslation(["translation"])
  useTitle(t("nav.legal-notice"))
  return (
    <>
      <Header title={t("nav.legal-notice")} image={HeaderImage}/>
    <section className="legal-notice">
      <div className="container legal-notice-container">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sed
          dignissim massa. Nullam ultrices lacinia faucibus. In hac habitasse
          platea dictumst. Sed eget mauris id lacus semper viverra. In lacinia
          congue neque vitae gravida. Nulla facilisi. Donec aliquet justo vitae
          odio fringilla, non gravida dui tincidunt.
        </p>
        <p>
          Quisque fringilla sapien vel semper commodo. Nulla malesuada ex
          interdum, tincidunt risus vitae, molestie odio. Donec rhoncus leo ut
          sapien tristique, et malesuada justo sollicitudin. Aliquam vitae
          vestibulum felis, id pharetra leo. Morbi tristique nunc nec mi gravida,
          nec luctus odio auctor. Maecenas malesuada mi id lacus laoreet, a
          tincidunt urna consectetur. Ut pharetra, sem a cursus vulputate, augue
          sapien dignissim odio, vel tincidunt sem dolor a urna. Curabitur
          consectetur malesuada erat, et posuere sem facilisis sit amet. Nunc
          consectetur, tortor non ultricies sollicitudin, arcu urna mattis nulla,
          eget dignissim velit mi sit amet orci. Vivamus dignissim felis quis
          consectetur convallis. Cras vitae neque vel velit gravida cursus vel
          id velit. Aliquam erat volutpat. Integer facilisis purus sit amet
          ligula interdum, ut aliquet velit interdum. Fusce dapibus facilisis
          odio, eu hendrerit velit eleifend non.
        </p>
      </div>
      </section>
    </>
  );
};

export default LegalNotice;
