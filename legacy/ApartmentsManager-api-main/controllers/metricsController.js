const Apartment = require('../models/Apartment');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

const metricsService = require('./metricsService.js');

const getBookedApartmentsForPeriod = async (start, end, apartmentId = null) => {

    const matchCriteria = {
        $or: [
            { fromDate: { $gte: start, $lte: end } },
            { toDate: { $gte: start, $lte: end } },
            { $and: [{ fromDate: { $lt: start } }, { toDate: { $gt: end } }] },
        ],
    };

    if (apartmentId) {
        matchCriteria.apartment = mongoose.Types.ObjectId(apartmentId);
    }

    const bookedApartments = await Booking.find(matchCriteria)
        .select({
            _id: 0,
            adultCount: 1,
            childrenCount: 1,
            fromDate: 1,
            toDate: 1,
            totalAmmountDue: 1,
            client: 1,
            channel: 1,
        })
        .populate({
            path: 'client',
            select: '_id',
        })
        .populate({
            path: 'channel',
            select: 'name',
        })
        .sort({ fromDate: 1 });

    return bookedApartments

}

const getMetrics = async (req, res) => {
    try {
        const { selectedDate } = req.query;

        if (!selectedDate) {
            return res.status(400).json({ error: 'Selected date is required.' });
        }
        const currentDate = new Date(selectedDate);
        const startDate = new Date(currentDate.getFullYear() - 2, 0, 1);
        const endDate = new Date(currentDate.getFullYear() + 1, 0, 1);
        
        const bookedApartments = await getBookedApartmentsForPeriod(startDate, endDate);
        const monthlyOccupancyRates = await metricsService.calculateMonthlyOccupancyRates(bookedApartments);
        const monthlyRevenue = await metricsService.calculateMonthlyRevenue(bookedApartments);
        const monthlyGuests = await metricsService.calculateMonthlyGuests(bookedApartments);
        const monthlyBookingStats = await metricsService.calculateMonthlybookingStats(bookedApartments);

        const metrics = {
            occupancy : monthlyOccupancyRates.monthlyData,
            revenue : monthlyRevenue.monthlyData,
            guests : monthlyGuests.monthlyData,
            bookings : monthlyBookingStats.monthlyData,
        };

        res.json(metrics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getMetrics,
};
