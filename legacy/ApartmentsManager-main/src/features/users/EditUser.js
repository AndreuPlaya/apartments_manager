import { useParams } from 'react-router-dom'
import EditUserForm from './EditUserForm'
import { useGetUsersQuery } from './usersApiSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditUser = () => {
    
    const { id } = useParams()

    const { user } = useGetUsersQuery("usersList", {
        selectFromResult: ({ data }) => ({
            user: data?.entities[id]
        }),
    })

    if (!user) return <LoadingSpinner />

    const content = <EditUserForm user={user} />

    return content
}
export default EditUser