import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useUpdateBookingMutation, useDeleteBookingMutation } from "./bookingsApiSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'
import useAuth from "../../hooks/useAuth";
import useTitle from "../../hooks/useTitle";
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


const EditBookingForm = ({ booking, clients, channels, apartments }) => {
  const { t } = useTranslation(["translation"])
  useTitle(t("private.edit-booking"))

  const { isManager, isAdmin } = useAuth();

  const apartmentsData = apartments
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((apartment) => (
      <option key={apartment.id} value={apartment.id}>
        {apartment.name}
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

  const channelsData = channels
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((channel) => (
      <option key={channel.id} value={channel.id}>
        {channel.name}
      </option>
    ));
  const [updateBooking, { isLoading, isSuccess, isError, error }] = useUpdateBookingMutation();
  const [deleteBooking, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeleteBookingMutation();

  const navigate = useNavigate();

  const [apartmentId, setApartmentId] = useState(booking.apartment._id)
  const [clientId, setClientId] = useState(booking.client._id)
  const [channelId, setChannelId] = useState(booking.channel._id)
  const [adultCount, setAdultCount] = useState(booking.adultCount)
  const [childrenCount, setChildrenCount] = useState(booking.childrenCount)
  const [fromDate, setFromDate] = useState(format(new Date(booking.fromDate), 'yyyy-MM-dd', { locale: es }))
  const [toDate, setToDate] = useState(format(new Date(booking.toDate), 'yyyy-MM-dd', { locale: es }))
  const [totalAmmountDue, setTotalAmmountDue] = useState(booking.totalAmmountDue)
  const [comment, setComment] = useState(booking.comment)
  const [validAdultCount, setValidAdultCount] = useState(false)
  const [validChildrenCount, setValidChildrenCount] = useState(false)
  const [validFromDate, setValidFromDate] = useState(false)
  const [validToDate, setValidToDate] = useState(false)

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      setApartmentId("");
      setClientId("");
      setChannelId("");
      setAdultCount("");
      setChildrenCount("");
      setFromDate("");
      setToDate("");
      setComment("")
      navigate(-1);
    }
  }, [isSuccess, isDelSuccess, navigate]);

  const canSave =
    [apartmentId,
      channelId,
      clientId,
      validAdultCount,
      validChildrenCount,
      validFromDate,
      validToDate].every(Boolean) && !isLoading;

  const onSaveBookingClicked = async (e) => {
    e.preventDefault();
    if (!canSave) return
    await updateBooking({
      id: booking.id,
      apartmentId,
      clientId,
      channelId,
      adultCount,
      childrenCount,
      fromDate,
      toDate,
      totalAmmountDue,
      comment
    });

  };
  const handleEditClient = () => navigate(`/private/clients/${clientId}`)
  const onDeleteBookingClicked = async () => {
    await deleteBooking({ id: booking.id });
  };

  useEffect(() => {
    const apartment = apartments.find(apartment => apartment._id === apartmentId);
    const maxGuests = apartment?.maxGuests || 0;
    setValidAdultCount(adultCount >= 1 && adultCount <= maxGuests);
  }, [adultCount, apartmentId, apartments]);

  useEffect(() => {
    setValidChildrenCount(childrenCount >= 0);
  }, [childrenCount]);

  useEffect(() => {
    setValidFromDate(fromDate);
  }, [fromDate]);


  useEffect(() => {
    const apartment = apartments.find(apartment => apartment._id === apartmentId);
    const minNights = apartment?.minNights || 1;
    const minCheckOutDate = new Date(fromDate);
    const checkOutDate = new Date(toDate);
    minCheckOutDate.setDate(minCheckOutDate.getDate() + minNights);
    setValidToDate(minCheckOutDate.getTime() <= checkOutDate.getTime());
  }, [fromDate, toDate, apartmentId, apartments]);

  const errClass = isError || isDelError ? "errmsg" : "offscreen";
  const errContent = error?.data?.message || delerror?.data?.message || "";

  let deleteButton = null;
  if (isManager || isAdmin) {
    deleteButton = (
      <Button title="Delete" onClick={onDeleteBookingClicked}>
        {t("private.delete")}
      </Button>
    );
  }

  return (
    <>
      <section className="edit__booking">
        <div className="container edit__booking-container">

          <p className={errClass}>{errContent}</p>
          <div className="form__title-row">
            <h2>{t("private.edit-booking")}</h2>
          </div>
          <FormContainer>
            <Container>
              <ElementWrapper>
                <Label>{t("private.apartment")}:</Label>
                <Select name="apartment" value={apartmentId} onChange={(e) => setApartmentId(e.target.value)}>
                  {apartmentsData}
                </Select>
              </ElementWrapper>
              <ElementWrapper>
                <Label>{t("private.channel")}:</Label>
                <Select name="channel" value={channelId} onChange={(e) => setChannelId(e.target.value)}>
                  {channelsData}
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
                  value={totalAmmountDue}
                  isValid="true"
                  onChange={(e) => setTotalAmmountDue(e.target.value)}
                />
              </ElementWrapper>
            </Container>
            <Container>
              <ElementWrapper>
                <Label>{t("private.adults")}:</Label>
                <Input
                  type="number"
                  value={adultCount}
                  isValid={validAdultCount}
                  onChange={(e) => setAdultCount(e.target.value)}
                />
              </ElementWrapper>
              <ElementWrapper>
                <Label>{t("private.children")}:</Label>
                <Input
                  type="number"
                  value={childrenCount}
                  isValid={validChildrenCount}
                  onChange={(e) => setChildrenCount(e.target.value)}
                />
              </ElementWrapper>
              <ElementWrapper>
                <Label>{t("private.checkin")}:</Label>
                <Input
                  type="date"
                  value={fromDate}
                  isValid={validFromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </ElementWrapper>
              <ElementWrapper>
                <Label>{t("private.checkout")}:</Label>
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
            <Button title="Save" onClick={onSaveBookingClicked} disabled={!canSave}>
              {t("private.save")}
            </Button>
            {deleteButton}
          </FormContainer>
        </div>
      </section>
    </>
  );
};

export default EditBookingForm;
