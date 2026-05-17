import { useGetContractsQuery } from "./contractsApiSlice";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faArrowLeft, faArrowLeftRotate, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import useTitle from '../../hooks/useTitle';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, addDays, startOfWeek } from 'date-fns'; // Import the necessary functions
import es from 'date-fns/locale/es'; // Import the locale
import LoadingSpinner from "../../components/LoadingSpinner";

const ROW_HEIGTH = 60;
const COLUMN_WIDTH = ROW_HEIGTH * 3;
const colorMap = {};
const colorList = [
    '#3280FB',
    '#FFAD1E',
    '#FF791E',
    '#1EFBD6',
    '#BF4D00',
    '#BF7A00',
    '#02327F',
    '#007965',
];

const getEventBackgroundColor = (id) => {
    if (colorMap.hasOwnProperty(id)) {
        return colorMap[id];
    }

    // Get the index of the ID in the color list
    const index = Object.keys(colorMap).length % colorList.length;

    // Assign the color to the ID
    colorMap[id] = colorList[index];

    return colorList[index];
};
const Wrapper = styled.div`
    overflow-y: auto;
`;
const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: min(100%, ${COLUMN_WIDTH * 7}px);
`;
const IconButton = styled.button`
display: flex;
flex-direction: column;
align-items: center;
justify-content: flex-end;
border: none;
padding: 20px;
background-color: transparent;
text-align: center;
text-decoration: none;
color: var(--text-light-2);
transition: color 0.3s;
width: 80px;
height: 80px;

&:hover {
    color: var(--primary-color);
}

svg {
  font-size: 30px;
}
`;
const GridWrapper = styled.div`
    display:block;
    position: relative;
    overflow: hidden;
    width: ${COLUMN_WIDTH * 7}px;
    border-right: 1px solid rgba(117, 117, 117, 0.4);
`;
const HGrid = styled.div`
    display: grid;
    grid-template-columns: ${({ first }) => first || ''} repeat(${({ cols }) => cols}, 1fr);
`;
const VGrid = styled.div`
    display: grid;
    grid-template-rows: ${({ first }) => first || ''} repeat(${({ rows }) => rows}, 1fr);
`;

const PropertyWrapper = styled.span`
  height: ${ROW_HEIGTH}px;
`;

const DayHeader = styled.span`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: ${COLUMN_WIDTH}px;
    height: ${ROW_HEIGTH}px;
    border-top: 2px solid var(--bg-dark-2);
    border-left: 2px solid var(--bg-dark-2);
    border-bottom: 2px solid var(--bg-dark-2);

    background: ${({ isToday, isWeekend }) => {
        if (isToday) {
            return 'var(--primary-color)';
        } else if (isWeekend) {
            return 'var(--bg-light-2)';
        } else {
            return 'var(--bg-light-1)';
        }
    }};
  
    color: ${({ isToday, isWeekend }) => {
        if (isToday) {
            return 'var(--text-dark-1)';
        } else if (isWeekend) {
            return 'var(--text-light-1)';
        } else {
            return 'var(--text-light-1)';
        }
    }};
`;

const MonthSelector = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;  
`;
const SelectedMonth = styled.div`
    font-size: 24px;
`;
const DayLine = styled.div`
    position: absolute;
    height: ${({ height }) => height}px;
    left: ${({ fromleft }) => fromleft}px;
    border: 1px solid rgba(117, 117, 117, 0.4); /* Semi-transparent red border */
    z-index: 10;
`;

const Event = styled(Link)`
    position: absolute;
    display: flex;
    height: ${ROW_HEIGTH}px;
    text-align: left;
    cursor: pointer;
    font-size: 0.8rem;
    text-decoration: none;
    left: ${({ fromleft }) => fromleft}px;
    width: ${({ howlong }) => howlong}px;
    background-color: ${({ color }) => color};
    color: var(--text-dark-1); 
    padding: 5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;
const Skew = styled.div`
    position: absolute;
    height: ${ROW_HEIGTH}px;
    width: ${ROW_HEIGTH / 5}px;
    position: absolute;
    left: ${({ fromleft }) => fromleft - ROW_HEIGTH / 10}px;
    
    transform: skew(-10deg);
    background-color: ${({ color }) => color};
    z-index: -1;
`;
const isToday = (date) => {
    const today = new Date();
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
};
const isWeekend = (date) => {
    const dayOfWeek = date.getDay(); // Sunday is 0, Saturday is 6
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

const calculateNumberOfNights = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds

    // Convert the input strings to Date objects
    const contractStartDate = new Date(startDate);
    const contractEndDate = new Date(endDate);

    // Calculate the difference in milliseconds between the two dates
    const diffMilliseconds = (contractEndDate - contractStartDate);

    // Calculate the number of nights by dividing the difference by one day's milliseconds
    const numberOfNights = Math.ceil(diffMilliseconds / oneDay);

    return numberOfNights;
}
const ContractsCalendar = () => {
    const { t } = useTranslation(['translation']);
    useTitle(t('nav.calendar'));
    const [selectedMonth, setSelectedMonth] = useState(new Date()); // Default to current month

    function getWeekArray(date) {
        const startingDayOfWeek = startOfWeek(date, { weekStartsOn: 1 }); // Monday
        const weekArray = [];

        for (let i = 0; i < 7; i++) {
            weekArray.push(addDays(startingDayOfWeek, i));
        }

        return weekArray;
    }

    function getWeekArrayForMonth(month) {
        const startingDayOfTheMonth = startOfMonth(month);
        const endingDayOfTheMonth = endOfMonth(month);
        const startingDayOfWeek = startOfWeek(startingDayOfTheMonth, { weekStartsOn: 1 }); // Monday

        const monthArray = [];

        let currentDay = startingDayOfWeek;

        while (currentDay <= endingDayOfTheMonth) {
            const weekArray = getWeekArray(currentDay); // Use the getWeekArray function here
            monthArray.push(weekArray);
            currentDay = addDays(currentDay, 7); // Move to the next week
        }

        return monthArray;
    }

    const {
        data: contracts,
        isLoading,
        isSuccess,
        isError,
        error,
    } = useGetContractsQuery('contractsList', {
        pollingInterval: 15000,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true,
    });

    if (isLoading) return <LoadingSpinner />

    if (isError) return <p className="errmsg">{error?.data?.message}</p>

    if (!isSuccess) return null;
    const { entities } = contracts;
    const properties = {};

    Object.values(entities).forEach((contract) => {
        const propertyName = contract.property.name;

        const contractStartDate = new Date(contract.fromDate);
        contractStartDate.setHours(0, 0, 0, 0); // Set time to midnight
        const contractEndDate = new Date(contract.toDate);
        contractEndDate.setHours(0, 0, 0, 0); // Set time to midnight

        // Check if the contract's end date is greater or equal to the start of the selected month
        // and if the contract's start date is less or equal to the end of the selected month

        if (!properties[propertyName]) {
            properties[propertyName] = {
                name: propertyName,
                contracts: []
            };
        }
        if (
            contractEndDate >= addDays(startOfMonth(selectedMonth), -7) &&
            contractStartDate <= addDays(endOfMonth(selectedMonth), 7)
        ) {
            properties[propertyName].contracts.push({
                id: contract._id,
                title: `${contract.client.name}`,
                description: `${contract.property.name + " (" + contract.adultCount + " + " + contract.childrenCount + ") "
                    + calculateNumberOfNights(contractStartDate, contractEndDate) + " " + t('calendar.nights')}`,
                dates: `${contractStartDate.getDate() + "/" + (contractStartDate.getMonth() + 1) + " => " + contractEndDate.getDate() + "/" + (contractEndDate.getMonth() + 1)}`,
                channel: `${contract.channel.name}`,
                comment: `${contract.comment ? contract.comment : ''}`,
                bgColor: getEventBackgroundColor(contract.property.name),
                start: contractStartDate,
                end: contractEndDate,
            });
        }
    });

    // Convert the properties object into an array and sort by name
    const sortedProperties = Object.values(properties).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <>
            <HeaderWrapper>
                <MonthSelector>
                    <IconButton onClick={() => {
                        setSelectedMonth(subMonths(selectedMonth, 1))
                    }}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </IconButton>
                    <IconButton onClick={() => {
                        setSelectedMonth(new Date())
                    }}>
                        <FontAwesomeIcon icon={faArrowLeftRotate} />
                    </IconButton>
                    <IconButton onClick={() => {
                        setSelectedMonth(addMonths(selectedMonth, 1))
                    }}>
                        <FontAwesomeIcon icon={faArrowRight} />
                    </IconButton>
                </MonthSelector>
                <SelectedMonth>{format(selectedMonth, 'MMMM yyyy', { locale: es })}</SelectedMonth>

            </HeaderWrapper>
            <Wrapper>
                <GridWrapper>
                    {getWeekArrayForMonth(selectedMonth).map((week) => (
                        <VGrid rows={sortedProperties.length}>
                            <HGrid cols={week.length}>
                                {week.map((day) => (
                                    <>
                                        <DayHeader
                                            key={day.getTime()} // Ensure a unique key for each day
                                            isToday={isToday(day)}
                                            isWeekend={isWeekend(day)}>
                                            <p>{day.toLocaleString('default', { weekday: 'short' })}</p>
                                            <p>{day.getDate()}</p>
                                        </DayHeader>
                                        <DayLine fromleft={day.getDay() * COLUMN_WIDTH} height={ROW_HEIGTH * (sortedProperties.length + 1)} />
                                    </>
                                ))}
                            </HGrid>

                            {sortedProperties.map((property) => (
                                <PropertyWrapper key={property.name}>
                                    {property.contracts.map((contract) => {
                                        const contractStart = new Date(contract.start);
                                        const contractEnd = new Date(contract.end);
                                        const isContractInRange =
                                            (contractStart >= week[0] && contractStart <= week[week.length - 1]) ||
                                            (contractEnd >= week[0] && contractEnd <= week[week.length - 1]) ||
                                            (contractStart <= week[0] && contractEnd >= week[week.length - 1]);

                                        if (!isContractInRange) return null; // No contract for this week
                                        const offsetStart = (calculateNumberOfNights(week[0], contractStart)) * COLUMN_WIDTH + COLUMN_WIDTH / 2
                                        const length = calculateNumberOfNights(contractStart, contractEnd) * COLUMN_WIDTH - COLUMN_WIDTH / 4
                                        const offsetEnd = offsetStart + length
                                        return (
                                            <>
                                                <Skew
                                                    fromleft={offsetStart}
                                                    color={contract.bgColor}
                                                />
                                                <Event
                                                    key={contract.id}
                                                    to={`/private/contracts/${contract.id}`}
                                                    fromleft={offsetStart}
                                                    howlong={length}
                                                    color={contract.bgColor}
                                                >
                                                    <div>
                                                        <p>{contract.title}</p>
                                                        <p>{contract.description}</p>
                                                        <p>{contract.dates + " " + contract.channel}</p>
                                                    </div>
                                                    <div>
                                                        <p>{contract.comment}</p>
                                                    </div>
                                                </Event>
                                                <Skew
                                                    fromleft={offsetEnd}
                                                    color={contract.bgColor}
                                                />
                                            </>
                                        );
                                    })}
                                </PropertyWrapper>
                            ))}
                        </VGrid>
                    ))}
                </GridWrapper>

            </Wrapper>
        </>
    );

};

export default CalendarView;


