import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";

const kpisAdapter = createEntityAdapter({});

const initialState = kpisAdapter.getInitialState();

export const kpisApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMetrics: builder.query({
      query: ({ selectedDate }) => ({
        url: '/kpis/metrics',
        params: { selectedDate },
        validateStatus: (response, result) => response.status === 200 && !result.isError,
      }),
      providesTags: (result, error, { selectedDate }) => [
        { type: 'KPI', id: `Metrics_${selectedDate}` },
      ],
    }),
  }),
});

export const {
  useGetMetricsQuery,
} = kpisApiSlice;

export const selectKPIsResult = kpisApiSlice.endpoints.getMetrics.select();

const selectKPIsData = createSelector(
  selectKPIsResult,
  (kpisResult) => kpisResult.data
);

export const {
  selectAll: selectAllKPIs,
  selectById: selectKPIById,
  selectIds: selectKPIIds,
} = kpisAdapter.getSelectors((state) => selectKPIsData(state) ?? initialState);
