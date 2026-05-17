import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import styled from 'styled-components';

const TableHeaderContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0.5em;
    position: sticky;
    top: 0;
    background: var(--bg-light-1);
    height: 50px;
`;

const SearchBar = styled.input`
    display: flex;
    flex-flow: column nowrap;
    gap: 0.75em;
    width: 400px;
    padding: 5px;
    border-radius: 4px;
    @media screen and (max-width: 768px) {
        font-size: 0.7rem;
    }
`;

const AddNewButton = styled(Link)`
    border-radius: 4px;
    background: var(--primary-color);
    padding: 5px 11px;
    color: var(--text-dark-1);
    outline: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-decoration: none;
    font-size: 1rem;
    transition: all 0.2s ease-in-out;

    &:hover {
        background: var(--action-active);
        color: var(--text-light-2);
    }
    @media screen and (max-width: 768px) {
        font-size: 0.8rem;
    }
`;

const EditionHeader = ({ onSearchChange }) => {
  const { t } = useTranslation(["translation"]);
  const location = useLocation();
  const [search, setSearch] = useState("");

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    onSearchChange(value);
  };

  return (
    <TableHeaderContainer>
      <SearchBar
        className="input"
        type="text"
        value={search}
        onChange={handleSearchChange}
        placeholder={t("nav.search")}
      />
      <AddNewButton
        to={`${location.pathname}/new`}
        className="icon-button"
        title={t("nav.new")}
      >
        {t("nav.new")}
      </AddNewButton>
    </TableHeaderContainer>
  );
};

export default EditionHeader;
