import { useNavigate } from 'react-router-dom'
import { useGetApartmentsQuery } from './apartmentsApiSlice'
import {memo} from 'react';
import { useTranslation } from 'react-i18next';
import {
    TableRow,
      TableCell
    } from "../../components/TableElements"
const Apartment = ({ apartmentId , search }) => {

    const { apartment } = useGetApartmentsQuery("apartmentsList", {
        selectFromResult: ({ data }) => ({
            apartment: data?.entities[apartmentId]
        }),
    })
    const { t } = useTranslation(["translation"])
    const navigate = useNavigate()
    if (!apartment) return null

    if (search !== "" && search) {
        const lowerCaseSearch = search.toLowerCase();
        const isNameMatch = apartment.name.toLowerCase().includes(lowerCaseSearch);
        if (!isNameMatch) {
            return null;
        }
    }

        const handleEdit = () => navigate(`/private/apartments/${apartmentId}`)

        return (
            <TableRow onClick={handleEdit}>
                <TableCell>{apartment.name}</TableCell>
                <TableCell>{apartment.address}</TableCell>
                <TableCell>{apartment.price}</TableCell>
                <TableCell>{apartment.maxGuests}</TableCell>
                <TableCell>
                    {apartment.isAvailable
                        ? <span className="apartment__status--open">{t("private.open")}</span>
                        : <span className="apartment__status--closed">{t("private.closed")}</span>
                    }
                </TableCell>

            </TableRow>
        )

}

const memoizedApartment = memo(Apartment)
export default memoizedApartment