import { useState, useEffect } from "react";
import { useUpdateClientMutation, useDeleteClientMutation } from "./clientsApiSlice";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useTitle from "../../hooks/useTitle";
import { useTranslation } from "react-i18next";
import ToggleButton from "../../components/input-buttons/ToggleButton";
import TextInput from "../../components/input-buttons/TextInput";
import TextInputLarge from "../../components/input-buttons/TextInputLarge";
import TextInputWithDropdown from "../../components/input-buttons/TextInputWithDropdown";
import { countries } from "../../config/countries-data"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BookingCard from "../../components/booking-card/BookingCard";
import {
  faCity,
  faComment,
  faEdit,
  faEnvelope,
  faGlobe,
  faIdCard,
  faPhone,
  faSave,
  faSignsPost,
  faStreetView,
  faTrash,
  faUser
} from "@fortawesome/free-solid-svg-icons";


const NAME_REGEX = /^[\p{L}\p{M}\s\d]{3,40}$/u;
const IDENTITY_DOCUMENT_REGEX = /^[A-Za-z0-9]{3,20}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const PHONE_NUMBER_REGEX = /^\+?\d{1,3}(?:[\s-]?\d{1,3}){2,}$/
const STREET_REGEX = /^[\p{L}\p{M}\d\s,-]{3,}$/u;
const CITY_REGEX = /^[\p{L}\p{M}\s]{3,}$/u;
const ZIP_CODE_REGEX = /^\d{5}(?:[-\s]\d{4})?$/

const EditClientForm = ({ client, bookings }) => {

  const { t } = useTranslation(["translation"]);
  const { t: countriesT } = useTranslation(["countries"]);
  useTitle(t("private.edit-client"));

  const [updateClient, { isLoading, isSuccess, isError, error }] = useUpdateClientMutation();
  const [deleteClient, { isSuccess: isDelSuccess, isError: isDelError, error: delError }] = useDeleteClientMutation();

  const { isManager, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isEditable, setIsEditable] = useState(false)
  const [identityDocument, setIdentityDocument] = useState(client.identityDocument);
  const [validIdentityDocument, setValidIdentityDocument] = useState(false);
  const [name, setName] = useState(client.name);
  const [validName, setValidName] = useState(false);
  const [email, setEmail] = useState(client.email);
  const [validEmail, setValidEmail] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(client.phoneNumber);
  const [comment, setComment] = useState(client.comment)
  const [validPhoneNumber, setValidPhoneNumber] = useState(false);
  const [street, setStreet] = useState(client.street);
  const [validStreet, setValidStreet] = useState(false);
  const [city, setCity] = useState(client.city);
  const [validCity, setValidCity] = useState(false);
  const [country, setCountry] = useState(client.country);
  const [zipCode, setZipCode] = useState(client.zipCode);
  const [validZipCode, setValidZipCode] = useState(false);

  const countryNames = countries.map(country => ({
    name: `${country.code} | ${countriesT(`countries.${country.code}`)}`,
    value: country.code
  }));

  useEffect(() => {
    setValidName(NAME_REGEX.test(name))
  }, [name]);

  useEffect(() => {
    setValidIdentityDocument(
      identityDocument?.trim().length === 0 ||
      IDENTITY_DOCUMENT_REGEX.test(identityDocument)
    );
  }, [identityDocument]);

  useEffect(() => {
    setValidEmail(
      !email ||
      email?.trim().length === 0 ||
      EMAIL_REGEX.test(email)
    );
  }, [email]);

  useEffect(() => {
    setValidPhoneNumber(
      !phoneNumber ||
      phoneNumber?.trim().length === 0 ||
      PHONE_NUMBER_REGEX.test(phoneNumber)
    );
  }, [phoneNumber]);

  useEffect(() => {
    setValidStreet(
      street?.trim().length === 0 ||
      STREET_REGEX.test(street)
    );
  }, [street]);

  useEffect(() => {
    setValidCity(
      city?.trim().length === 0 ||
      CITY_REGEX.test(city)
    );
  }, [city]);


  useEffect(() => {
    setValidZipCode(
      !zipCode ||
      zipCode?.trim().length === 0 ||
      ZIP_CODE_REGEX.test(zipCode)
    );
  }, [zipCode]);

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      setIdentityDocument("");
      setName("");
      setEmail("");
      setPhoneNumber("");
      setStreet("");
      setCity("");
      setCountry("");
      setZipCode("");
      navigate(-1);
    }
  }, [isSuccess, isDelSuccess, navigate]);

  const toggleEdit = (value) => {
    setIsEditable(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!canSave) return
    await updateClient({
      id: client.id,
      identityDocument,
      name,
      email,
      phoneNumber,
      street,
      city,
      country,
      zipCode,
      comment
    });
  }
  const onDeleteClicked = async () => {
    await deleteClient({ id: client.id });
  };

  const canSave =
    [validIdentityDocument,
      validName,
      validEmail,
      validPhoneNumber,
      validStreet,
      validCity,
      validZipCode].every(Boolean) && !isLoading;

  const errClass = (isError || isDelError) ? "errmsg" : "offscreen";

  const errContent = (error?.data?.message || delError?.data?.message) ?? "";

  return (
    <>
      <section className="content-grid">

        <form
          className="edit-client__form"
          onSubmit={handleSubmit}
          action="none"
          method="PATCH"
        >
          <p className={errClass}>{errContent}</p>

          <div className="form__title-row">
            <h2>{`${t("private.client")} ${client.id}`}</h2>
            {isManager && <ToggleButton
              label={<> <FontAwesomeIcon icon={faEdit} /> {t("private.edit")} </>}
              className="btn"
              onChange={toggleEdit}
            >
            </ToggleButton>}
          </div>

          <div className="form__row">
            <div className="form__column">
              <TextInput
                id="name"
                className={validName ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faUser} /> {t("private.name")}</>}
                disabled={!isEditable}
                defaultValue={name}
                onChange={(value) => setName(value)}
              />
              <TextInput
                id="email"
                type="email"
                className={validEmail ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faEnvelope} /> {t("private.email")}</>}
                disabled={!isEditable}
                defaultValue={email}
                onChange={(value) => setEmail(value)}
              />
              <TextInput
                id="phoneNumber"
                className={validPhoneNumber ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faPhone} /> {t("private.phone-number")}</>}
                disabled={!isEditable}
                defaultValue={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
              />
              <TextInput
                id="identityDocument"
                className={validIdentityDocument ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faIdCard} /> {t("private.identity-document")}</>}
                disabled={!isEditable}
                defaultValue={identityDocument}
                onChange={(value) => setIdentityDocument(value)}
              />
            </div>
            <div className="form__column">
              <TextInputWithDropdown
                id="country"
                type="text"
                label={<><FontAwesomeIcon icon={faGlobe} /> {t("private.country")}</>}
                defaultValue={country ? `${country} | ${countriesT(`countries.${country}`)}` : ''}
                disabled={!isEditable}
                onChange={(value) => setCountry(value)}
                itemList={countryNames}
              />
              <TextInput
                id="city"
                className={validCity ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faCity} /> {t("private.city")}</>}
                disabled={!isEditable}
                defaultValue={city}
                onChange={(value) => setCity(value)}
              />
              <TextInput
                id="street"
                className={validStreet ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faStreetView} /> {t("private.street")}</>}
                disabled={!isEditable}
                defaultValue={street}
                onChange={(value) => setStreet(value)}
              />
              <TextInput
                id="zip-code"
                className={validZipCode ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faSignsPost} /> {t("private.zip-code")}</>}
                disabled={!isEditable}
                defaultValue={zipCode}
                onChange={(value) => setZipCode(value)}
              />
            </div>
          </div>
          <div className="form__column">
            <TextInputLarge
              id="comment"
              label={<><FontAwesomeIcon icon={faComment} /> {t("private.comment")}</>}
              disabled={!isEditable}
              defaultValue={comment}
              onChange={(value) => setComment(value)}
            />
          </div>
          <div className="form__btn-wrapper">
            {(isManager && isEditable) && <button
              className={`btn ${canSave ? "" : "disabled"}`}
              type="submit"
              formMethod="PATCH"
              disabled={!canSave}
            >
              {<><FontAwesomeIcon icon={faSave} /> {t("private.save")}</>}
            </button>}
            {(isAdmin && isEditable) && <button
              className="btn"
              type="button"
              formMethod="DELETE"
              onClick={onDeleteClicked}
            >
              {<><FontAwesomeIcon icon={faTrash} /> {t("private.delete")}</>}
            </button>}
          </div>
        </form>
      </section>
      {(bookings?.length > 0 && !isEditable) && <section className="content-grid">
        <div className="form__title-row">
          <h2>{t("nav.bookings")}</h2>
        </div>
        <div className="content-list__grid">
          {bookings.map((booking) =>
            <BookingCard booking={booking} key={booking.id} />
          )}
        </div>
      </section>}
    </>
  );

};

export default EditClientForm;
