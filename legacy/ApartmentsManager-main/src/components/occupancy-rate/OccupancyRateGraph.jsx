import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OccupancyRateGraph = ({ data }) => {
    const occupancyData = data.occupancyRates.map(entry => ({
        name: entry.date,
        occupancyRate: entry.occupancyRate,
    }));

    const CustomizedLabel = ({ x, y, stroke, value }) => (
        <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle">
            {value}
        </text>
    );

    const CustomizedAxisTick = ({ x, y, stroke, payload }) => (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
                {payload.value}
            </text>
        </g>
    );

    return (
        <div className="occupancy-rate-graph__wrapper">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={occupancyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" height={60} tick={<CustomizedAxisTick />} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="occupancyRate" stroke="#8884d8" label={<CustomizedLabel />} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default OccupancyRateGraph;
