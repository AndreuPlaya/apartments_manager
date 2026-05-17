import ProgressCircle from "./ProgressCircle";
import "./stat-box.css"

const StatBox = ({ title, subtitle, icon, progress, increase }) => {

    return (
        <div className="stat-box__wrapper sm">
            <div className="stat-box__top" >
                <div className="stat-box__left">
                    <h5>{icon}</h5>
                    <h2>{title}</h2>
                </div>
                <div className="stat-box__right">
                    <ProgressCircle progress={progress} />
                </div>
            </div>
            <div className="stat-box__bottom">
                <h5>{subtitle}</h5>
                <h5>{increase}</h5>
            </div>
        </div>
    );
};

export default StatBox;