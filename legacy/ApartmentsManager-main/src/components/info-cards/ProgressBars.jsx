import React from 'react';
import { BarChart, Bar, ResponsiveContainer, LabelList } from 'recharts';

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

const CustomLabel = ({ x, y, width, height, value }) => {
    const formattedValue = nFormatter(value, 1);
    return (
        <>
            <text
                x={x + width / 2}
                y={y + height / 2}
                fill="none"
                stroke="var(--color-gray-200)"
                strokeWidth={3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={14}
                fontWeight="bold"
            >
                {formattedValue}
            </text>
            <text
                x={x + width / 2}
                y={y + height / 2}
                fill="var(--color-gray-400)"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={14}
                fontWeight="bold"
            >
                {formattedValue}
            </text>
        </>
    );
};


const ProgressBars = ({ oldNumber, newNumber }) => {

    // Create data array for Bar chart with two values representing old and new numbers
    const chartData = [
        { name: 'Old', value: oldNumber },
        { name: 'New', value: newNumber },
    ];

    return (
        <ResponsiveContainer width="100%" height="100%" >
            <BarChart data={chartData}>
                <Bar type="monotone" dataKey="value" fill='var(--color-primary)'>
                    <LabelList dataKey="value" content={<CustomLabel />} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export default ProgressBars;
