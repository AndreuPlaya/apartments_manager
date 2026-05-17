import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BookingDistributionChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <p>No data available.</p>;
    }

    // Get a list of unique channels across all entries
    const channels = [...new Set(data.flatMap(entry => entry.channel))].sort();

    const groupedData = data.reduce((acc, entry) => {
        const key = entry.date;
        if (!acc[key]) {
            acc[key] = {};
        }
        entry.channel.forEach((channel, index) => {
            // Assuming there's a corresponding count for each channel in entry.count
            acc[key][channel] = entry.count[index];
        });
        return acc;
    }, {});

    // Convert grouped data into an array for Recharts
    const chartData = Object.keys(groupedData)
        .map(date => ({
            date,
            ...groupedData[date],
        }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
                <YAxis/>
                <XAxis dataKey="date" angle={-60} textAnchor="end" interval={0} height={60} />
                <Tooltip content={({ label, payload }) => {
                    const total = channels.reduce((acc, channel) => acc + (payload[0]?.payload[channel] || 0), 0);
                    return (
                        <div style={{ background: 'var(--color-gray-700)', padding: '0.5rem', border: '1px solid #ccc' }}>
                            <p>{`${label} (${total})`}</p>
                            {channels.slice().reverse().map((channel, index) => (
                                <p key={index}>{`${payload[0]?.payload[channel] || 0} ${channel}`}</p>
                            ))}
                        </div>
                    );
                }} />
                <Legend/>
                {channels.map((channel, index) => (
                    <Bar
                        key={index}
                        dataKey={channel}
                        stackId="a"
                        fill={`var(--color-analogous-${index + 1})`
                        } />


                ))}
            </BarChart>
        </ResponsiveContainer>
    );
};

export default BookingDistributionChart;
