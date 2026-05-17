import { useState } from 'react';
import useTitle from "../../hooks/useTitle";
import DatePicker from "../../components/date-picker/DatePicker";
import OccupancyRate from '../../components/occupancy-rate/OccupancyRate';



const KpiView = () => {
    useTitle('KPIs');
    const today = new Date();
    const [selectedStartDate, setSelectedStartDate] = useState(today);
    const [selectedEndDate, setSelectedEndDate] = useState(today);

    const handleStartDateChange = (date) => {
        setSelectedStartDate(date);
    };

    const handleEndDateChange = (date) => {
        setSelectedEndDate(date);
    };

    return (
        <>
            <section className="content-grid">
                <DatePicker onDateChange={handleStartDateChange} defaultDate={selectedStartDate} />
                <DatePicker onDateChange={handleEndDateChange} defaultDate={selectedEndDate} />
                <div className="dashboard-grid">
                    <OccupancyRate startDate={selectedStartDate} endDate={selectedEndDate} />
                </div>
            </section>
        </>
    );
};

export default KpiView;
