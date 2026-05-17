import { useState, useEffect } from "react";
import { useAddNewContractMutation } from "./contractsApiSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useTitle from "../../hooks/useTitle";
import { RENTAL_TYPES } from "../../config/rentalTypes"
import {
    FormContainer,
    Container,
    ElementWrapper,
    Label,
    Button,
    Select,
    Input,
    InputComment
} from "../../components/FormElements"

import { format } from 'date-fns'; // Import the necessary functions
import es from 'date-fns/locale/es'; // Import the locale

const NAME_REGEX = /^[\p{L}\p{M}\s\d]{3,40}$/u;

const NewContractForm = ({ properties, clients }) => {

    const { t } = useTranslation(["translation"]);
    useTitle(t("private.new-contract"));

    const navigate = useNavigate();
    const [addNewContract, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useAddNewContractMutation();


    const propertiesData = properties
        ?.filter((property) => property.rentalType === RENTAL_TYPES.longTerm)
        .map((property) => (
            <option key={property.id} value={property.id}>
                {property.fullName}
            </option>
        ));


    const today = new Date();
    const [name, setName] = useState('');
    const [validName, setValidName] = useState(false);
    const [propertyId, setPropertyId] = useState(properties[0]._id);
    const [clientId, setClientId] = useState('');
    const [monthlyRent, setMonthlyRent] = useState('')
    const [fromDate, setFromDate] = useState(format(today, 'yyyy-MM-dd', { locale: es }))
    const [validFromDate, setValidFromDate] = useState(false);
    const [toDate, setToDate] = useState('');
    const [validToDate, setValidToDate] = useState(false);
    const [comment, setComment] = useState('')

    useEffect(() => {
        if (isSuccess) {
            setPropertyId("");
            setClientId("");
            setFromDate("");
            setToDate("");
            setMonthlyRent(0)
            setComment("")
            navigate(-1);
        }
    }, [isSuccess, navigate]);

    useEffect(() => {
        setValidName(NAME_REGEX.test(name));
    }, [name]);


    useEffect(() => {
        setValidFromDate(fromDate);
        const minEndDate = new Date(fromDate);
        minEndDate.setDate(minEndDate.getDate() + 2)
        minEndDate.setHours(0, 0, 0, 0);
        setToDate(format(minEndDate, 'yyyy-MM-dd', { locale: es }))
    }, [fromDate]);

    useEffect(() => {
        const minNights = 1;
        const minEndDate = new Date(fromDate);
        const endDate = new Date(toDate);
        minEndDate.setDate(minEndDate.getDate() + minNights)
        setValidToDate(minEndDate.getTime() < endDate.getTime());
    }, [fromDate, toDate]);

    useEffect(() => {
        const client = clients?.find(client => client.id === clientId);
        if (client) {
            setName(client.name);
        }
    }, [clientId, clients]);

    const canSave =
        [propertyId,
            clientId || validName,
            validFromDate,
            validToDate].every(Boolean) && !isLoading;

    const onSaveContractClicked = async (e) => {
        e.preventDefault();
        if (!canSave) return
        await addNewContract({
            propertyId,
            clientId,
            clientName: name,
            fromDate,
            toDate,
            monthlyRent,
            comment: comment
        });
    };


    const onPropertyIdChanged = (e) => setPropertyId(e.target.value);

    const selectClient = (client) => {
        setName(client.name)
        setClientId(client.id)
    };

    const errClass = isError ? "errmsg" : "offscreen";

    return (
        <>
            <section className="new__contract">
                <div className="container new__contract-container">
                    <p className={errClass}>{error?.data?.message}</p>
                    <div className="form__title-row">
                        <h2>{t("private.new-contract")}</h2>
                    </div>
                    <FormContainer>
                        <Container>
                            <ElementWrapper>
                                <Label>{t("private.property")}:</Label>
                                <Select name="property" value={propertyId} onChange={onPropertyIdChanged}>
                                    {propertiesData}
                                </Select>
                            </ElementWrapper>
                            
                            <ElementWrapper>
                                <Label>{t("private.monthly-rent")}:</Label>
                                <Input
                                    type="number"
                                    value={monthlyRent}
                                    isValid="true"
                                    onChange={(e) => setMonthlyRent(e.target.value)}
                                />
                            </ElementWrapper>
                        </Container>
                        <Container>
                            <ElementWrapper>
                                <Label>{t("private.from-date")}:</Label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    isValid={validFromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </ElementWrapper>
                            <ElementWrapper>
                                <Label>{t("private.to-date")}:</Label>
                                <Input
                                    type="date"
                                    value={toDate}
                                    isValid={validToDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </ElementWrapper>
                        </Container>
                    </FormContainer>
                    <FormContainer>
                        <ElementWrapper>
                            <Label>{t("private.comment")}:</Label>
                            <InputComment
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </ElementWrapper>
                    </FormContainer>
                    <FormContainer>
                        <Button title="Save" onClick={onSaveContractClicked} disabled={!canSave}>
                            {t("private.save")}
                        </Button>
                    </FormContainer>
                </div>
            </section>
        </>
    );
};

export default NewContractForm;
