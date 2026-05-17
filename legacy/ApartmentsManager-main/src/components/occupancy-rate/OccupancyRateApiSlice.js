import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";

const kpisAdapter = createEntityAdapter({});

const initialState = kpisAdapter.getInitialState();

export const kpisApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOccupancyRate: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/kpis/occupancy-rate',
        params: { startDate, endDate },
        validateStatus: (response, result) => response.status === 200 && !result.isError,
      }),
      providesTags: (result, error, { startDate, endDate }) => [
        { type: 'KPI', id: `OccupancyRate_${startDate}_${endDate}` },
      ],
    }),
    getYearlyOccupancyRate: builder.query({
      query: ({ year, apartmentId }) => ({
        url: '/kpis/yearly-occupancy-rate',
        params: { year, apartmentId },
        validateStatus: (response, result) => response.status === 200 && !result.isError,
      }),
      providesTags: (result, error, { year, apartmentId }) => [
        { type: 'KPI', id: `YearlyOccupancyRate_${year}_${apartmentId || 'all'}` },
      ],
    }),
  }),
});

export const {
  useGetOccupancyRateQuery,
  useGetYearlyOccupancyRateQuery,
} = kpisApiSlice;

export const selectKPIsResult = kpisApiSlice.endpoints.getOccupancyRate.select();

const selectKPIsData = createSelector(
  selectKPIsResult,
  (kpisResult) => kpisResult.data
);

export const {
  selectAll: selectAllKPIs,
  selectById: selectKPIById,
  selectIds: selectKPIIds,
} = kpisAdapter.getSelectors((state) => selectKPIsData(state) ?? initialState);
