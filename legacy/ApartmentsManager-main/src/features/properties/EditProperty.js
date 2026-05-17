import { useParams } from 'react-router-dom'
import EditPropertyForm from './EditPropertyForm'
import { useGetPropertiesQuery } from './propertiesApiSlice'
import useTitle from '../../hooks/useTitle'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditProperty = () => {
    useTitle('Edit Property')

    const { id } = useParams()

    const { property } = useGetPropertiesQuery("propertiesList", {
        selectFromResult: ({ data }) => ({
            property: data?.entities[id]
        }),
    })

    if (!property) return <LoadingSpinner />

    return (<EditPropertyForm property={property} />)
}
export default EditProperty