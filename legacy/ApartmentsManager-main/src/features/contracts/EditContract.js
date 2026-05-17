import { useParams } from 'react-router-dom'
import EditContractForm from './EditContractForm'
import { useGetContractsQuery } from './contractsApiSlice'
import { useGetClientsQuery } from '../clients/clientsApiSlice'
import { useGetPropertiesQuery } from '../properties/propertiesApiSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditContract = () => {

    const { id } = useParams()

    const { contract } = useGetContractsQuery("contractsList", {
        selectFromResult: ({ data }) => ({
            contract: data?.entities[id]
        }),
    })

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

    if (!contract || !clients?.length ||  !properties?.length) return <LoadingSpinner/>  

    const content = <EditContractForm contract={contract} clients={clients} properties={properties} />

    return content
}
export default EditContract