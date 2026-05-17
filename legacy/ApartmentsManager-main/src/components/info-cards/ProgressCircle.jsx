import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ProgressCircle = ({ progress }) => {
    // Adjust COLORS based on the sign of progress
    const COLORS = progress >= 0 ? ['var(--color-primary)', 'var(--color-gray-400)'] : ['var(--color-error)', 'var(--color-gray-400)'];
    
    // Create data array for Pie chart with a single value representing the progress
    const chartData = [
        { value: Math.abs(progress) },
        { value: 100 - Math.abs(progress) },
    ];
    
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={15}
                    outerRadius={25}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}

export default ProgressCircle;