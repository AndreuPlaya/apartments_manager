import { useGetContractsQuery } from "./contractsApiSlice"
import Contract from "./Contract"
import useTitle from "../../hooks/useTitle"
import { useTranslation } from 'react-i18next'
import { useState } from "react"
import EditionHeader from "../../components/TableEditionHeader"
import {
    Table,
    TableHead,
    TableRow,
    TableTh,
} from "../../components/TableElements"
import LoadingSpinner from "../../components/LoadingSpinner"

const ContractsList = () => {
    const {
        data: contracts,
        isLoading,
        isSuccess,
        isError,
        error
    } = useGetContractsQuery('contractsList', {
        pollingInterval: 15000,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })


    const [search, setSearch] = useState('')
    const { t } = useTranslation(["translation"])
    useTitle(t("nav.contracts"))

    if (isLoading) return <LoadingSpinner />

    if (isError) return (
        <>
            <EditionHeader onSearchChange={setSearch} />
            <p className="errmsg">{error?.data?.message}</p>
        </>)

    if (!isSuccess) return null

    const { ids } = contracts;
    const tableContent = Object.values(ids).map((contractId) => (
        <Contract key={contractId} contractId={contractId} search={search} />
    ));

    return (
        <>
            <section className="contracts__list">
                <div className="container contracts__list-container">
                    <EditionHeader onSearchChange={setSearch} />
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>{t("private.property")}</TableTh>
                                <TableTh>{t("private.client")}</TableTh>
                                <TableTh>{t("private.from-date")}</TableTh>
                                <TableTh>{t("private.to-date")}</TableTh>
                                <TableTh>{t("private.monthly-rent")}</TableTh>
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
export default ContractsList