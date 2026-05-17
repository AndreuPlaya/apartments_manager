import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['aqua', 'red'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const OccupancyRateAverage = ({ data }) => {
    // Calculate the average occupancy rate
    const totalOccupancyRate = data.occupancyRates.reduce((sum, entry) => sum + entry.occupancyRate, 0);
    const averageOccupancyRate = totalOccupancyRate / data.occupancyRates.length;

    // Create data array for Pie chart with a single value representing the average
    const chartData = [
        { name: 'Occupied', value: averageOccupancyRate },
        { name: 'Vacant', value: 100 - averageOccupancyRate },
    ];

    return (
        <div className="occupancy-rate-average__wrapper">
            <ResponsiveContainer width="100%" height="100%" >
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={40}
                        outerRadius={60}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default OccupancyRateAverage;
