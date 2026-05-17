import React, { useState } from 'react';
import { useGetMetricsQuery } from "./dashboardApiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTranslation } from "react-i18next";
import useTitle from "../../hooks/useTitle";
import useAuth from '../../hooks/useAuth';
import "./dashboard.css"
import StatBox from "../../components/info-cards/StatBox"
import CompareBox from "../../components/info-cards/CompareBox"
import BookingDistributionBox from "../../components/info-cards/BookingDistributionBox"
import CumulativeRevenueBox from "../../components/info-cards/CumulativeRevenueBox"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBed, faCartFlatbedSuitcase, faEur, faMoneyBillTrendUp, faUsers } from "@fortawesome/free-solid-svg-icons";
import MonthSelector from "../../components/date-picker/MonthSelector";
import { monthNames } from '../../config/data';

const Dashboard = () => {
    const { username, isManager } = useAuth();

    const { t } = useTranslation(["translation"]);
    useTitle(t("nav.dashboard"));

    const defaultDate = new Date();
    defaultDate.setHours(0, 0, 0, 0);
    const maxDate = new Date(defaultDate);
    maxDate.setMonth(defaultDate.getMonth() + 6)
    const [selectedDate, setSelectedDate] = useState(defaultDate);

    const { data: metrics, isLoading, isError, error, refetch } = useGetMetricsQuery({
        selectedDate: selectedDate.toISOString(),
    });


    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    const currentBookingsData = metrics?.bookings?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear());
    const lastYearBookingsData = metrics?.bookings?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear() - 1);
    const currentGuestsData = metrics?.guests?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear());
    const lastYearGuestsData = metrics?.guests?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear() - 1);
    const currentRevenueData = metrics?.revenue?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear());
    const lastYearRevenueData = metrics?.revenue?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear() - 1);
    const currentOccupancyData = metrics?.occupancy?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear());
    const lastYearOccupancyData = metrics?.occupancy?.find(entry => entry.month === selectedDate.getMonth() + 1 && entry.year === selectedDate.getFullYear() - 1);

    const roundToTwoDecimalPlaces = (value) => {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            return parseFloat(numericValue.toFixed(2));
        }
        return 0;
    };

    const currentOccupancy = roundToTwoDecimalPlaces(currentOccupancyData?.occupancy.average);
    const lastYearOccupancyIncrease = roundToTwoDecimalPlaces(currentOccupancy - (lastYearOccupancyData?.occupancy?.average));

    const currentGuests = currentGuestsData?.guests.totalAdults + currentGuestsData?.guests.totalChildren || 0
    const lastYearGuests = lastYearGuestsData?.guests.totalAdults + lastYearGuestsData?.guests.totalChildren || 0
    const lastYearGuestIncrease = currentGuests - lastYearGuests;

    const currentBookings = currentBookingsData?.bookings.total || 0
    const lastYearBookings = lastYearBookingsData?.bookings.total || 0
    const lastYearBookingsIncrease = currentBookings - lastYearBookings;


    const currentIncome = Math.floor(currentRevenueData?.revenue) || 0
    const lastYearIncome = Math.floor(lastYearRevenueData?.revenue) || 0
    const lastYearIncomeIncrease = currentIncome - lastYearIncome;

    const bookingsChartData = metrics?.bookings
        ?.filter(entry => entry.year === selectedDate.getFullYear())
        ?.map(entry => {
            return {
                date: t(monthNames[entry.month - 1]).substring(0, 3),
                channel: entry.bookings?.distribution?.map(item => item.channel),
                count: entry.bookings?.distribution?.map(item => item.count),
                percentage: entry.bookings?.distribution?.map(item => item.percentage),
            };
        });

    const revenueChartData = metrics?.revenue
        ?.filter(entry => entry.month <= defaultDate.getMonth() + 1 || entry.year !== defaultDate.getFullYear())
        ?.map(entry => {
            return {
                year: entry.year,
                month: entry.month,
                revenue: roundToTwoDecimalPlaces(entry.revenue),
                cumulative: roundToTwoDecimalPlaces(entry.cumulative)
            }
        })

    if (isLoading) return <LoadingSpinner />;

    if (isError) return <p className="errmsg">{error?.data?.message}</p>;

    return (
        <section className="content-grid">
            <div className="dashboard__header">
                <h2>Welcome {username}</h2>
            </div>
            <>
                <MonthSelector
                    defaultDate={defaultDate}
                    maxDate={maxDate}
                    onChange={handleDateChange}
                />
                <div className="dashboard__grid">
                    <StatBox
                        icon={<FontAwesomeIcon icon={faBed} />}
                        title={`${currentOccupancy}%`}
                        progress={currentOccupancy}
                        subtitle={t("dashboard.occupancy-rate")}
                        increase={`${lastYearOccupancyIncrease > 0 ? `+${lastYearOccupancyIncrease}` : lastYearOccupancyIncrease}%`}
                    />
                    <CompareBox
                        icon={<FontAwesomeIcon icon={faUsers} />}
                        title={currentGuests}
                        oldNumber={lastYearGuests}
                        newNumber={currentGuests}
                        subtitle={t("dashboard.guests")}
                        increase={`${lastYearGuestIncrease > 0 ? `+${lastYearGuestIncrease}` : lastYearGuestIncrease}`}
                    />

                    {isManager &&
                        <CompareBox
                            icon={<FontAwesomeIcon icon={faMoneyBillTrendUp} />}
                            title={<>{currentIncome} <FontAwesomeIcon icon={faEur} /></>}
                            oldNumber={lastYearIncome}
                            newNumber={currentIncome}
                            subtitle={t("dashboard.income")}
                            increase={<>{lastYearIncomeIncrease >= 0 ? `+${lastYearIncomeIncrease}` : lastYearIncomeIncrease} <FontAwesomeIcon icon={faEur} /></>}
                        />}
                    <CompareBox
                        icon={<FontAwesomeIcon icon={faCartFlatbedSuitcase} />}
                        title={currentBookings}
                        oldNumber={lastYearBookings}
                        newNumber={currentBookings}
                        subtitle={t("dashboard.bookings")}
                        increase={`${lastYearBookingsIncrease > 0 ? `+${lastYearBookingsIncrease}` : lastYearBookingsIncrease}`}
                    />
                    <BookingDistributionBox data={bookingsChartData || []} />
                    {isManager && <CumulativeRevenueBox data={revenueChartData || []} />}
                </div>
            </>
        </section>
    );
};

export default Dashboard;
