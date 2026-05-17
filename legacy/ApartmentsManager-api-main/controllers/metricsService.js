const Apartment = require('../models/Apartment');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');


const averageDateArray = (dateArray) => {
    if (!dateArray || dateArray.length === 0) {
        return 0; // or another appropriate default value
    }

    const total = dateArray.reduce((sum, entry) => sum + entry.occupancyRate, 0);
    const average = total / dateArray.length;

    return parseFloat(average).toFixed(2);
};

const calculateOccupancyRates = (startDate, endDate, occupancyMap, totalApartments) => {
    const occupancyRates = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
        const occupiedRooms = occupancyMap.get(formattedDate) || 0;
        const occupancyRate = (occupiedRooms / totalApartments) * 100;
        occupancyRates.push({ date: formattedDate, occupancyRate });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return occupancyRates;
};

const populateOccupancyMap = (bookedApartments) => {
    const occupancyMap = new Map();

    bookedApartments.forEach((booking) => {
        const checkinDate = new Date(booking.fromDate);
        const checkoutDate = new Date(booking.toDate);

        let currentDate = new Date(checkinDate);
        while (currentDate < checkoutDate) {
            const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
            occupancyMap.set(formattedDate, (occupancyMap.get(formattedDate) || 0) + 1);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    return occupancyMap;
};

const calculateMonthlyOccupancyRates = async (bookedApartments) => {
    try {
        if (!bookedApartments || bookedApartments.length === 0) {
            throw new Error('No booked apartments provided');
        }

        // Find the start and end dates based on the bookedApartments
        const startDate = new Date(Math.min(...bookedApartments.map(booking => new Date(booking.toDate))));
        const endDate = new Date(Math.max(...bookedApartments.map(booking => new Date(booking.toDate))));

        const currentYear = endDate.getFullYear();

        const occupancyMap = populateOccupancyMap(bookedApartments);
        // find the highest value in the occupancy map array
        const totalApartments = Math.max(...occupancyMap.values());

        const monthlyData = [];

        for (let year = startDate.getFullYear(); year <= currentYear; year++) {
            for (let month = 0; month < 12; month++) {
                const monthStartDate = new Date(year, month, 1);
                const monthEndDate = new Date(year, month + 1, 0);

                const occupancyRates = calculateOccupancyRates(monthStartDate, monthEndDate, occupancyMap, totalApartments);

                monthlyData.push({
                    year,
                    month: month + 1,
                    occupancy: {
                        average: averageDateArray(occupancyRates),
                        dailyData: occupancyRates,
                    }
                });
            }
        }

        return { monthlyData };
    } catch (error) {
        console.error(error);
        throw new Error('Error calculating monthly data');
    }
}; 

const calculateMonthlyRevenue = async (bookedApartments) => {
    try {
        if (!bookedApartments || bookedApartments.length === 0) {
            throw new Error('No booked apartments provided');
        }

        // Find the start and end dates based on the bookedApartments
        const startDate = new Date(Math.min(...bookedApartments.map(booking => new Date(booking.toDate))));
        const endDate = new Date(Math.max(...bookedApartments.map(booking => new Date(booking.toDate))));

        const currentYear = endDate.getFullYear();

        const monthlyData = [];

        for (let year = startDate.getFullYear(); year <= currentYear; year++) {
            let cumulativeRevenue = 0; // Initialize cumulative revenue for the year

            for (let month = 0; month < 12; month++) {
                const monthStartDate = new Date(year, month, 1);
                const monthEndDate = new Date(year, month + 1, 0);

                // Filter bookings for the current month
                const bookingsForMonth = bookedApartments.filter(booking => {
                    const bookingStartDate = new Date(booking.fromDate);
                    return (
                        bookingStartDate >= monthStartDate && bookingStartDate <= monthEndDate
                    );
                });

                // Calculate total revenue for the month
                const totalMonthlyRevenue = bookingsForMonth.reduce(
                    (total, booking) => total + (booking.totalAmmountDue || 0),
                    0
                );

                cumulativeRevenue += totalMonthlyRevenue; // Update cumulative revenue

                monthlyData.push({
                    year,
                    month: month + 1,
                    revenue: totalMonthlyRevenue,
                    cumulative: cumulativeRevenue // Add cumulative revenue to the data
                });
            }
        }

        return { monthlyData };
    } catch (error) {
        console.error(error);
        throw new Error('Error calculating monthly data');
    }
};


const calculateMonthlyGuests = async (bookedApartments) => {
    try {
        if (!bookedApartments || bookedApartments.length === 0) {
            throw new Error('No booked apartments provided');
        }

        // Find the start and end dates based on the bookedApartments
        const startDate = new Date(Math.min(...bookedApartments.map(booking => new Date(booking.toDate))));
        const endDate = new Date(Math.max(...bookedApartments.map(booking => new Date(booking.toDate))));

        const currentYear = endDate.getFullYear();

        const monthlyData = [];

        for (let year = startDate.getFullYear(); year <= currentYear; year++) {
            for (let month = 0; month < 12; month++) {
                const monthStartDate = new Date(year, month, 1);
                const monthEndDate = new Date(year, month + 1, 0);

                // Filter bookings for the current month
                const bookingsForMonth = bookedApartments.filter(booking => {
                    const bookingStartDate = new Date(booking.fromDate);
                    const bookingEndDate = new Date(booking.toDate);
                    return (
                        bookingEndDate >= monthStartDate && bookingEndDate <= monthEndDate
                        || bookingStartDate >= monthStartDate && bookingStartDate <= monthEndDate
                    );
                });

                // Track different guests and their counts
                const guestCounts = new Map();

                bookingsForMonth.forEach(booking => {
                    // Assuming each booking has a unique identifier for a guest
                    const guestIdentifier = booking.client.id;
                    const adults = booking.adultCount || 0;
                    const children = booking.childrenCount || 0;

                    if (!guestCounts.has(guestIdentifier)) {
                        guestCounts.set(guestIdentifier, { adults, children });
                    } else {
                        const currentCounts = guestCounts.get(guestIdentifier);
                        guestCounts.set(guestIdentifier, {
                            adults: currentCounts.adults > adults ? currentCounts.adults : adults,
                            children: currentCounts.children > children ? currentCounts.children : children,
                        });
                    }
                });

                // Compute total number of adults and children for all different guests
                let totalAdults = 0;
                let totalChildren = 0;

                for (const counts of guestCounts.values()) {
                    totalAdults += counts.adults;
                    totalChildren += counts.children;
                }

                const totalDifferentGuests = {
                    totalAdults,
                    totalChildren,
                };

                monthlyData.push({
                    year,
                    month: month + 1,
                    guests: totalDifferentGuests,
                });
            }
        }
        return { monthlyData };
    } catch (error) {
        console.error(error);
        throw new Error('Error calculating monthly data');
    }
};

const calculateChannelDistribution = (bookings) => {
    const channelCounts = new Map();

    bookings.forEach(booking => {
        const channel = booking.channel.name;
        channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
    });

    const totalBookings = bookings.length;

    // Convert Map to an array of objects for easy access in the result
    const distributionArray = Array.from(channelCounts.entries()).map(([channel, count]) => ({
        channel,
        count,
        percentage: (count / totalBookings) * 100,
    }));

    return distributionArray;
};

const calculateMonthlybookingStats = async (bookedApartments) => {
    try {
        if (!bookedApartments || bookedApartments.length === 0) {
            throw new Error('No booked apartments provided');
        }

        // Find the start and end dates based on the bookedApartments
        const startDate = new Date(Math.min(...bookedApartments.map(booking => new Date(booking.toDate))));
        const endDate = new Date(Math.max(...bookedApartments.map(booking => new Date(booking.toDate))));

        const currentYear = endDate.getFullYear();

        const monthlyData = [];

        for (let year = startDate.getFullYear(); year <= currentYear; year++) {
            for (let month = 0; month < 12; month++) {
                const monthStartDate = new Date(year, month, 1);
                const monthEndDate = new Date(year, month + 1, 0);

                // Filter bookings for the current month
                const bookingsForMonth = bookedApartments.filter(booking => {
                    const bookingStartDate = new Date(booking.fromDate);
                    const bookingEndDate = new Date(booking.toDate);
                    return (
                        bookingStartDate >= monthStartDate && bookingStartDate <= monthEndDate
                    );
                });

                // Calculate total number of bookings for the month
                const totalBookings = bookingsForMonth.length;

                // Calculate the distribution of channels
                const channelDistribution = calculateChannelDistribution(bookingsForMonth);

                monthlyData.push({
                    year,
                    month: month + 1,
                    bookings: {
                        total: totalBookings,
                        distribution: channelDistribution,
                    },
                });
            }
        }
        return { monthlyData };
    } catch (error) {
        console.error(error);
        throw new Error('Error calculating monthly data');
    }
};


module.exports = {
    calculateMonthlyOccupancyRates,
    calculateMonthlyRevenue,
    calculateMonthlyGuests,
    calculateMonthlybookingStats
};
