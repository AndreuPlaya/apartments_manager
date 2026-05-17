
import useTitle from '../../hooks/useTitle'
import { useTranslation } from "react-i18next"
import MainHeader from '../../components/MainHeader';
import Welcome from '../../components/Welcome';
import RoomsCarrousel from '../../components/room-card/RoomsCarrousel';
import LineDivider from '../../components/LineDivider';
import { apartments } from "../../config/data";
import "./home.css"

const Home = () => {
  useTitle('');
  const { t } = useTranslation(['translation']);

  return (
    <>
      <MainHeader />
      <Welcome />
      <div className="rooms__header">
        <div className="rooms__header-container">
          <h1>{t("home.our-rooms")}</h1>
          <p>{t("home.rooms-description")}</p>
          <LineDivider />
        </div>
      </div>
      <section className="rooms__showcase">
        <div className="container rooms__showcase-container">
          <RoomsCarrousel data={apartments}/>
        </div >
      </section>
    </>
  );
};

export default Home;
