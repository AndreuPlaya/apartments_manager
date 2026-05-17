import NewContractForm from './NewContractForm'
import { useGetClientsQuery } from '../clients/clientsApiSlice'
import { useGetPropertiesQuery } from '../properties/propertiesApiSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const NewContract = () => {

    const { clients } = useGetClientsQuery("clientsList", {
        selectFromResult: ({ data }) => ({
            clients: data?.ids.map(id => data?.entities[id])
        }),
    })
        

    const { properties } = useGetPropertiesQuery("propertiesList", {
        selectFromResult: ({ data }) => ({
            properties: data?.ids.map(id => data?.entities[id])
        }),
    })
    
    if (!clients?.length || !properties?.length) return <LoadingSpinner/>

    return <NewContractForm properties={properties} clients={clients} />
    
}
export default NewContract