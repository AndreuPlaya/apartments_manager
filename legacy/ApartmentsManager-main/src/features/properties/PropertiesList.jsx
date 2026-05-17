import { useGetPropertiesQuery } from "./propertiesApiSlice"
import Property from './Property'
import useTitle from "../../hooks/useTitle"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import EditionHeader from "../../components/TableEditionHeader"
import {
    Table,
    TableHead,
    TableRow,
    TableTh,
} from "../../components/TableElements"
import LoadingSpinner from "../../components/LoadingSpinner"
const PropertiesList = () => {

    const {
        data: properties,
        isLoading,
        isSuccess,
        isError,
        error
    } = useGetPropertiesQuery('propertiesList', {
        pollingInterval: 60000,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })

    const [search, setSearch] = useState('')
    const { t } = useTranslation(["translation"])
    useTitle(t("nav.properties"))

    if (isLoading) return <LoadingSpinner />

    if (isError) return (
        <>
            <EditionHeader onSearchChange={setSearch} />
            <p className="errmsg">{error?.data?.message}</p>
        </>)

    if (!isSuccess) return null

    const { ids } = properties

    const tableContent = ids?.length && ids.map(propertyId => <Property key={propertyId} propertyId={propertyId} search={search} />)

    return (
        <>
            <section className="properties__list">
                <div className="container properties__list-container">
                    <EditionHeader onSearchChange={setSearch} />
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>{t("private.name")}</TableTh>
                                <TableTh>{t("private.address")}</TableTh>
                                <TableTh>{t("private.floor")}</TableTh>
                                <TableTh>{t("private.door")}</TableTh>
                                <TableTh>{t("private.rental-type")}</TableTh>
                                <TableTh>{t("private.available")}</TableTh>
                            </TableRow>
                        </TableHead>
                        <tbody>
                            {tableContent}
                        </tbody>
                    </Table>
                </div>
            </section>
        </>
    )
}
export default PropertiesList