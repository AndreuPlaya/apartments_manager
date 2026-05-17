import { useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useGetUsersQuery } from "./usersApiSlice";
import useAuth from '../../hooks/useAuth'
import useTitle from "../../hooks/useTitle";
import UserCard from "../../components/user-card/UserCard";
import LoadingSpinner from "../../components/LoadingSpinner";


const UsersList = () => {
    const { data: users, isLoading, isSuccess, isError, error } =
        useGetUsersQuery("usersList", {
            pollingInterval: 60000,
            refetchOnFocus: true,
            refetchOnMountOrArgChange: true,
        });
    const { isAdmin } = useAuth();
    const { t } = useTranslation(["translation"])
    const navigate = useNavigate()


    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1);

    useTitle(t("nav.users"))

    if (isLoading) return <LoadingSpinner />

    if (isError) return <p className="errmsg">{error?.data?.message}</p>;

    if (!isSuccess) return null

    const { entities } = users;
    const sortedUsers = Object.values(entities)
        .filter(user =>
            user.username.toLowerCase().includes(search.toLowerCase())
            || (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => a.username.localeCompare(b.username));

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setCurrentPage(1)
    };

    const handleNew = () => navigate('/private/users/new')

    const itemsPerPage = 10; // Adjust the number of items per page as needed

    const indexOfLastUser = currentPage * itemsPerPage;
    const indexOfFirstUser = indexOfLastUser - itemsPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
    const maxPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
            <h1> {t("nav.users")}</h1>
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
                    {isAdmin && <div className="content-list__new-item" onClick={handleNew}>
                        <p><FontAwesomeIcon icon={faPlus} /></p>
                        <p>{t("private.new-record")}</p>
                    </div>}
                    {currentUsers.map((user) =>
                        <UserCard user={user} key={user.id} />
                    )}
                </div>
            </div>
            <div className="pagination">
                {renderPaginationButtons()}
            </div>
        </section>
    );

};

export default UsersList;
