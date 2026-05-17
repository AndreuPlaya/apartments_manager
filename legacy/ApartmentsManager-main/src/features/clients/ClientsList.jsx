import { useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useGetClientsQuery } from "./clientsApiSlice";
import useAuth from '../../hooks/useAuth'
import useTitle from "../../hooks/useTitle";
import ClientCard from "../../components/client-card/ClientCard";
import LoadingSpinner from "../../components/LoadingSpinner";


const ClientsList = () => {
    const { data: clients, isLoading, isSuccess, isError, error } =
        useGetClientsQuery("clientsList", {
            pollingInterval: 60000,
            refetchOnFocus: true,
            refetchOnMountOrArgChange: true,
        });
    const { isManager } = useAuth();
    const { t } = useTranslation(["translation"])
    const navigate = useNavigate()


    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1);

    useTitle(t("nav.clients"))

    if (isLoading) return <LoadingSpinner />

    if (isError) return <p className="errmsg">{error?.data?.message}</p>;

    if (!isSuccess) return null

    const { entities } = clients;
    const sortedClients = Object.values(entities)
        .filter(client =>
            client.name.toLowerCase().includes(search.toLowerCase()) ||
            (client.phoneNumber && client.phoneNumber.toLowerCase().includes(search.toLowerCase())) ||
            (client.identityDocument && client.identityDocument.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setCurrentPage(1)
    };

    const handleNew = () => {
        navigate('/private/clients/new');
    };

    const itemsPerPage = 10; // Adjust the number of items per page as needed

    const indexOfLastClient = currentPage * itemsPerPage;
    const indexOfFirstClient = indexOfLastClient - itemsPerPage;
    const currentClients = sortedClients.slice(indexOfFirstClient, indexOfLastClient);
    const maxPages = Math.ceil(sortedClients.length / itemsPerPage);
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const displayPageRange = 5;

    const renderPaginationButtons = () => {
        const buttons = [];
        const startPage = Math.max(1, currentPage - Math.floor(displayPageRange / 2));
        const endPage = Math.min(maxPages, startPage + displayPageRange - 1);

        if (startPage > 1) {
            buttons.push(
                <button key={1} onClick={() => paginate(1)}>
                    1
                </button>
            );
            if (startPage > 2) {
                buttons.push(<span key="ellipsis-start">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => paginate(i)}
                    className={currentPage === i ? "active" : ""}
                >
                    {i}
                </button>
            );
        }

        if (endPage < maxPages) {
            if (endPage < maxPages - 1) {
                buttons.push(<span key="ellipsis-end">...</span>);
            }
            buttons.push(
                <button key={maxPages} onClick={() => paginate(maxPages)}>
                    {maxPages}
                </button>
            );
        }

        return buttons;
    };

    return (
        <section className="content-grid">
            <h1> {t("nav.clients")}</h1>
            <div className="content-list__wrapper">
                <div className="content-list__header">
                    <input
                        type="text"
                        placeholder={t("nav.search")}
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="content-list__grid">
                    {isManager && <div className="content-list__new-item" onClick={handleNew}>
                        <p><FontAwesomeIcon icon={faPlus} /></p>
                        <p>{t("private.new-record")}</p>
                    </div>}
                    {currentClients.map((client) =>
                        <ClientCard client={client} key={client.id} />
                    )}
                </div>
            </div>
            <div className="pagination">
                {renderPaginationButtons()}
            </div>
        </section>
    );

};

export default ClientsList;
