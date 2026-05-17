import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const contractsAdapter = createEntityAdapter({
    sortComparer: (a, b) => {
      const dateA = new Date(a.fromDate);
      const dateB = new Date(b.fromDate);
      
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      return 0;
    }
  });
  

const initialState = contractsAdapter.getInitialState()

export const contractsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getContracts: builder.query({
            query: () => ({
                url: '/contracts',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformResponse: responseData => {
                const loadedContracts = responseData.map(contract => {
                    contract.id = contract._id
                    return contract
                });
                return contractsAdapter.setAll(initialState, loadedContracts)
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'Contract', id: 'LIST' },
                        ...result.ids.map(id => ({ type: 'Contract', id }))
                    ]
                } else return [{ type: 'Contract', id: 'LIST' }]
            }
        }),
        addNewContract: builder.mutation({
            query: initialContract => ({
                url: '/contracts',
                method: 'POST',
                body: {
                    ...initialContract,
                }
            }),
            invalidatesTags: [
                { type: 'Contract', id: "LIST" }
            ]
        }),
        updateContract: builder.mutation({
            query: initialContract => ({
                url: '/contracts',
                method: 'PATCH',
                body: {
                    ...initialContract,
                }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Contract', id: arg.id }
            ]
        }),
        deleteContract: builder.mutation({
            query: ({ id }) => ({
                url: `/contracts`,
                method: 'DELETE',
                body: { id }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Contract', id: arg.id }
            ]
        }),
    }),
})

export const {
    useGetContractsQuery,
    useAddNewContractMutation,
    useUpdateContractMutation,
    useDeleteContractMutation,
} = contractsApiSlice

// returns the query result object
export const selectContractsResult = contractsApiSlice.endpoints.getContracts.select()

// creates memoized selector
const selectContractsData = createSelector(
    selectContractsResult,
    contractsResult => contractsResult.data // normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectAllContracts,
    selectById: selectContractById,
    selectIds: selectContractIds
    // Pass in a selector that returns the contracts slice of state
} = contractsAdapter.getSelectors(state => selectContractsData(state) ?? initialState)