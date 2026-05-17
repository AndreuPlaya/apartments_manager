import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer, Legend } from 'recharts';
import { monthNames } from '../../config/data';
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEur } from '@fortawesome/free-solid-svg-icons';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--color-gray-700)', padding: '0.5rem', border: '1px solid #ccc' }}>
                <p className="label">{`${label}`}</p>
                {payload.map((data, index) => (
                    <div key={index} className="tooltip-item">
                        <p>{`${data.name}:  ${nFormatter(data.payload[data.name], 1)} `}<FontAwesomeIcon icon={faEur} />{` (+${nFormatter(data.payload.revenue[data.name], 1)} `}<FontAwesomeIcon icon={faEur} />{')'}</p>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

const CustomLabel = ({ x, y, width, height, value }) => {
    const formattedValue = nFormatter(value, 1);
    return (
        <>
            <text
                x={x}
                y={y-8}
                fill="var(--color-gray-400)"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight="bold"
            >
                {formattedValue}
            </text>
        </>
    );
};

function nFormatter(num, digits) {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
    const item = lookup.findLast(item => num >= item.value);
    return item ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol) : "0";
}

// Process data to calculate cumulative revenue
const processCumulativeRevenue = (data) => {
    const cumulativeData = {};
    data.forEach(entry => {
        const { year, month, revenue, cumulative } = entry;
        if (!cumulativeData[year]) {
            cumulativeData[year] = [];
        }
        cumulativeData[year].push({ month, revenue, cumulative });
    });
    return cumulativeData;
};

const CumulativeRevenueBox = ({ data }) => {
    const { t } = useTranslation(["translation"]);
    if (!data || data.length === 0) {
        return <p>No data available.</p>;
    }

    const cumulativeRevenueData = processCumulativeRevenue(data);

    // Convert grouped data into an array for Recharts
    const months = monthNames.map(entry => t(entry).substring(0, 3));
    const chartData = months.map((month, index) => {
        const dataPoint = { month, revenue: {} };
        Object.keys(cumulativeRevenueData).forEach(year => {
            const monthData = cumulativeRevenueData[year].find(entry => entry.month === index + 1);
            dataPoint[year] = monthData?.cumulative;
            dataPoint.revenue[year] = monthData?.revenue;
        });
        return dataPoint;
    });
    
    return (
        <div className="stat-box__wrapper md">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <XAxis dataKey="month" angle={-60} textAnchor="end"  interval={0} height={60} />
                    <YAxis tickFormatter={(tick) => nFormatter(tick, 1)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend/>
                    {Object.keys(cumulativeRevenueData).map((year, index) => (
                        <Line
                            key={index}
                            type="monotone"
                            dataKey={year}
                            stroke={`var(--color-analogous-${index + 1})`}
                        >
                            <LabelList dataKey={year} content={<CustomLabel />} />
                        </Line>
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CumulativeRevenueBox;
