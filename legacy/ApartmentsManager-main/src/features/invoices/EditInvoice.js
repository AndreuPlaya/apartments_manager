import { useParams } from 'react-router-dom'
import EditUserForm from './EditUserForm'
import { useGetUsersQuery } from './usersApiSlice'
import useTitle from '../../hooks/useTitle'
import LoadingSpinner from '../../components/LoadingSpinner'

const EditUser = () => {
    useTitle('Edit User')

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