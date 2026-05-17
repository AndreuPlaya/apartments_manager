import DistributionChart from "./DistributionChart";
import "./stat-box.css"

const BookingDistributionBox = ({ title, subtitle, icon, data }) => {

    return (
        <div className="stat-box__wrapper lg">
            <DistributionChart data={data} />
        </div>
    );
};

export default BookingDistributionBox;