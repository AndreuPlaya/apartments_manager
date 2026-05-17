import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetContractsQuery } from './contractsApiSlice';
import { memo } from 'react';
import {
    TableRow,
    TableCell,
} from "../../components/TableElements"
import { format } from 'date-fns'; // Import the necessary functions
import es from 'date-fns/locale/es'; // Import the locale

const Contract = ({ contractId, search }) => {
    const { contract } = useGetContractsQuery("contractsList", {
        selectFromResult: ({ data }) => ({
            contract: data?.entities[contractId]
        }),
    });

    const navigate = useNavigate();


    if (!contract) return null;

    if (search !== "" && search) {
        const lowerCaseSearch = search.toLowerCase();
        const isNameMatch = contract.client.name.toLowerCase().includes(lowerCaseSearch);
        const isPropertyMatch = contract.property.name.toLowerCase().includes(lowerCaseSearch);
        if (!isNameMatch && !isPropertyMatch) {
            return null;
        }
    }

    const fromDate = format(new Date(contract.fromDate), 'dd-MM-yyyy', { locale: es });
    const toDate = format(new Date(contract.toDate), 'dd-MM-yyyy', { locale: es });
    const handleEdit = () => navigate(`/private/contracts/${contractId}`);


    if (!contract) return null

    return (
        <TableRow onClick={handleEdit}>
            <TableCell >{contract.property.fullName}</TableCell>
            <TableCell >{contract.client.name}</TableCell>
            <TableCell >{fromDate}</TableCell>
            <TableCell >{toDate}</TableCell>
            <TableCell >{contract.monthlyRent}</TableCell>
        </TableRow>
    );

};

const memoizedContract = memo(Contract);

export default memoizedContract;
