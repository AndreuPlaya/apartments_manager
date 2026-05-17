import { useGetOccupancyRateQuery } from "./OccupancyRateApiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import OccupancyRateGraph from "./OccupancyRateGraph";
import OccupancyRateAverage from "./OccupancyRateAverage";
import "./occupancy-rate.css"

const OccupancyRate = ({ startDate, endDate }) => {


    const { data: occupancyData, isLoading, isError, error } = useGetOccupancyRateQuery({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
    });


    if (isLoading) return <LoadingSpinner />;

    if (isError) return <p className="errmsg">{error?.data?.message}</p>;

    return (
        <div className="occupancy-rate__wrapper">
            <OccupancyRateGraph data={occupancyData} />
            <OccupancyRateAverage data={occupancyData} />
        </div>

    );
};

export default OccupancyRate;
