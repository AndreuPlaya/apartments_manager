import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const apartmentsAdapter = createEntityAdapter({
    sortComparer: (a, b) => {
      if (a.isAvailable === b.isAvailable) {
        return a.name.localeCompare(b.name); // Sort by name if isAvailable is the same
      } else {
        return a.isAvailable ? -1 : 1; // Sort by isAvailable in ascending order
      }
    }
  });

const initialState = apartmentsAdapter.getInitialState()

export const apartmentsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getApartments: builder.query({
            query: () => ({
                url: '/apartments',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformResponse: responseData => {
                const loadedApartments = responseData.map(apartment => {
                    apartment.id = apartment._id
                    return apartment
                });
                return apartmentsAdapter.setAll(initialState, loadedApartments)
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'Apartment', id: 'LIST' },
                        ...result.ids.map(id => ({ type: 'Apartment', id }))
                    ]
                } else return [{ type: 'Apartment', id: 'LIST' }]
            }
        }),
        addNewApartment: builder.mutation({
            query: initialApartment => ({
                url: '/apartments',
                method: 'POST',
                body: {
                    ...initialApartment,
                }
            }),
            invalidatesTags: [
                { type: 'Apartment', id: "LIST" }
            ]
        }),
        updateApartment: builder.mutation({
            query: initialApartment => ({
                url: '/apartments',
                method: 'PATCH',
                body: {
                    ...initialApartment,
                }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Apartment', id: arg.id }
            ]
        }),
        deleteApartment: builder.mutation({
            query: ({ id }) => ({
                url: `/apartments`,
                method: 'DELETE',
                body: { id }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Apartment', id: arg.id }
            ]
        }),
    }),
})

export const {
    useGetApartmentsQuery,
    useAddNewApartmentMutation,
    useUpdateApartmentMutation,
    useDeleteApartmentMutation,
} = apartmentsApiSlice

// returns the query result object
export const selectApartmentsResult = apartmentsApiSlice.endpoints.getApartments.select()

// creates memoized selector
const selectApartmentsData = createSelector(
    selectApartmentsResult,
    apartmentsResult => apartmentsResult.data // normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectAllApartments,
    selectById: selectApartmentById,
    selectIds: selectApartmentIds
    // Pass in a selector that returns the apartments slice of state
} = apartmentsAdapter.getSelectors(state => selectApartmentsData(state) ?? initialState)