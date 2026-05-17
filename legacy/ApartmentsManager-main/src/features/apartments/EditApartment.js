import { useParams } from 'react-router-dom'
import EditApartmentForm from './EditApartmentForm'
import { useGetApartmentsQuery } from './apartmentsApiSlice'
import useTitle from '../../hooks/useTitle'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditApartment = () => {
    useTitle('Edit Apartment')

    const { id } = useParams()

    const { apartment } = useGetApartmentsQuery("apartmentsList", {
        selectFromResult: ({ data }) => ({
            apartment: data?.entities[id]
        }),
    })

    if (!apartment) return <LoadingSpinner/>

    const content = <EditApartmentForm apartment={apartment} />

    return content
}
export default EditApartment