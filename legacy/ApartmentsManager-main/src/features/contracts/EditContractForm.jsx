import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useUpdateContractMutation, useDeleteContractMutation } from "./contractsApiSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'
import useAuth from "../../hooks/useAuth";
import useTitle from "../../hooks/useTitle";
import { RENTAL_TYPES } from "../../config/rentalTypes"
import {
  FormContainer,
  Container,
  ElementWrapper,
  Label,
  Button,
  Input,
  InputComment,
  Select,
  SelectionWrapper,
  IconButton

} from "../../components/FormElements"

import { format } from 'date-fns'; // Import the necessary functions
import es from 'date-fns/locale/es'; // Import the locale


const EditContractForm = ({ contract, clients, properties }) => {
  const { t } = useTranslation(["translation"])
  useTitle(t("private.edit-contract"))

  const { isManager, isAdmin } = useAuth();

  const propertiesData = properties
    .filter((property) => property.rentalType === RENTAL_TYPES.longTerm)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((property) => (
      <option key={property.id} value={property.id}>
        {property.fullName}
      </option>
    ));



  const clientsData = clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((client) => (
      <option key={client.id} value={client.id}>
        {client.name}
      </option>
    ));

  const [updateContract, { isLoading, isSuccess, isError, error }] = useUpdateContractMutation();
  const [deleteContract, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeleteContractMutation();

  const navigate = useNavigate();

  const [propertyId, setPropertyId] = useState(contract.property._id)
  const [clientId, setClientId] = useState(contract.client._id)
  const [fromDate, setFromDate] = useState(format(new Date(contract.fromDate), 'yyyy-MM-dd', { locale: es }))
  const [toDate, setToDate] = useState(format(new Date(contract.toDate), 'yyyy-MM-dd', { locale: es }))
  const [monthlyRent, setMonthlyRent] = useState(contract.monthlyRent)
  const [comment, setComment] = useState(contract.comment)
  const [validFromDate, setValidFromDate] = useState(false)
  const [validToDate, setValidToDate] = useState(false)

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      setPropertyId("");
      setClientId("");
      setFromDate("");
      setToDate("");
      setMonthlyRent(0)
      setComment("")
      navigate(-1);
    }
  }, [isSuccess, isDelSuccess, navigate]);

  const canSave =
    [propertyId,
      clientId,
      monthlyRent,
      validFromDate,
      validToDate].every(Boolean) && !isLoading;

  const onSaveContractClicked = async (e) => {
    e.preventDefault();
    if (!canSave) return
    await updateContract({
      id: contract.id,
      propertyId,
      clientId,
      fromDate,
      toDate,
      monthlyRent,
      comment: comment
    });

  };
  const handleEditClient = () => navigate(`/private/clients/${clientId}`)
  const onDeleteContractClicked = async () => {
    await deleteContract({ id: contract.id });
  };


  useEffect(() => {
    setValidFromDate(fromDate);
  }, [fromDate]);


  useEffect(() => {
    const minNights = 1;
    const minEndDate = new Date(fromDate);
    const endDate = new Date(toDate);
    minEndDate.setDate(minEndDate.getDate() + minNights);
    endDate.setDate(endDate.getDate());
    setValidToDate(minEndDate.getTime() < endDate.getTime());
  }, [fromDate, toDate, propertyId, properties]);

  const errClass = isError || isDelError ? "errmsg" : "offscreen";
  const errContent = error?.data?.message || delerror?.data?.message || "";

  let deleteButton = null;
  if (isManager || isAdmin) {
    deleteButton = (
      <Button title="Delete" onClick={onDeleteContractClicked}>
        {t("private.delete")}
      </Button>
    );
  }

  return (
    <>
      <section className="edit__contract">
        <div className="container edit__contract-container">
          <p className={errClass}>{errContent}</p>
          <div className="form__title-row">
            <h2>{t("private.edit-contract")}</h2>
          </div>
          <FormContainer>
            <Container>
              <ElementWrapper>
                <Label>{t("private.property")}:</Label>
                <Select name="property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                  {propertiesData}
                </Select>
              </ElementWrapper>
              <ElementWrapper>
                <Label>{t("private.client")}:</Label>
                <SelectionWrapper>
                  <Select name="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                    {clientsData}
                  </Select>
                  <IconButton onClick={handleEditClient}>
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </IconButton>
                </SelectionWrapper>
              </ElementWrapper>
              <ElementWrapper>
                <Label>{t("private.total-ammount-due")}:</Label>
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
            {deleteButton}
          </FormContainer>
        </div>
      </section>
    </>
  );
};

export default EditContractForm;
