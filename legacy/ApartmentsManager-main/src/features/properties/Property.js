import { useNavigate } from 'react-router-dom'
import { useGetPropertiesQuery } from './propertiesApiSlice'
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { RENTAL_TYPES } from "../../config/rentalTypes"
import {
    TableRow,
    TableCell
} from "../../components/TableElements"
const Property = ({ propertyId, search }) => {

    const { property } = useGetPropertiesQuery("propertiesList", {
        selectFromResult: ({ data }) => ({
            property: data?.entities[propertyId]
        }),
    })
    const { t } = useTranslation(["translation"])
    const navigate = useNavigate()
    if (!property) return null

    if (search !== "" && search) {
        const lowerCaseSearch = search.toLowerCase();
        const isNameMatch = property.name.toLowerCase().includes(lowerCaseSearch);
        if (!isNameMatch) {
            return null;
        }
    }

    const handleEdit = () => navigate(`/private/properties/${propertyId}`)
    const rentalTypeText = property.rentalType === RENTAL_TYPES.longTerm
        ? t("private.long-term")
        : property.rentalType === RENTAL_TYPES.shortTerm
            ? t("private.short-term")
            : property.rentalType === RENTAL_TYPES.room
                ? t("private.room")
                : "";
                
    return (
        <TableRow onClick={handleEdit}>
            <TableCell>{property.name}</TableCell>
            <TableCell>{property.address}</TableCell>
            <TableCell>{property.floor}</TableCell>
            <TableCell>{property.door}</TableCell>
            <TableCell>{rentalTypeText}</TableCell>
            <TableCell>
                {property.isAvailable
                    ? <span className="property__status--open">{t("private.open")}</span>
                    : <span className="property__status--closed">{t("private.closed")}</span>
                }
            </TableCell>

        </TableRow>
    )

}

const memoizedProperty = memo(Property)
export default memoizedProperty