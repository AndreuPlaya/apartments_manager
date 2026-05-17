import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const channelsAdapter = createEntityAdapter({})

const initialState = channelsAdapter.getInitialState()

export const channelsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getChannels: builder.query({
            query: () => ({
                url: '/channels',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformResponse: responseData => {
                const loadedChannels = responseData.map(channel => {
                    channel.id = channel._id
                    return channel
                });
                return channelsAdapter.setAll(initialState, loadedChannels)
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'Channel', id: 'LIST' },
                        ...result.ids.map(id => ({ type: 'Channel', id }))
                    ]
                } else return [{ type: 'Channel', id: 'LIST' }]
            }
        }),
        addNewChannel: builder.mutation({
            query: initialChannelData => ({
                url: '/channels',
                method: 'POST',
                body: {
                    ...initialChannelData,
                }
            }),
            invalidatesTags: [
                { type: 'Channel', id: "LIST" }
            ]
        }),
        updateChannel: builder.mutation({
            query: initialChannelData => ({
                url: '/channels',
                method: 'PATCH',
                body: {
                    ...initialChannelData,
                }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Channel', id: arg.id }
            ]
        }),
        deleteChannel: builder.mutation({
            query: ({ id }) => ({
                url: `/channels`,
                method: 'DELETE',
                body: { id }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Channel', id: arg.id }
            ]
        }),
    }),
})

export const {
    useGetChannelsQuery,
    useAddNewChannelMutation,
    useUpdateChannelMutation,
    useDeleteChannelMutation,
} = channelsApiSlice

// returns the query result object
export const selectChannelsResult = channelsApiSlice.endpoints.getChannels.select()

// creates memoized selector
const selectChannelsData = createSelector(
    selectChannelsResult,
    channelsResult => channelsResult.data // normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectAllChannels,
    selectById: selectChannelById,
    selectIds: selectChannelIds
    // Pass in a selector that returns the channels slice of state
} = channelsAdapter.getSelectors(state => selectChannelsData(state) ?? initialState)