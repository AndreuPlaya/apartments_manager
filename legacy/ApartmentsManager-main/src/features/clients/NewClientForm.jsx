import { useState, useEffect } from "react";
import { useAddNewClientMutation } from "./clientsApiSlice";
import { useNavigate } from "react-router-dom";
import useTitle from "../../hooks/useTitle";
import { useTranslation } from "react-i18next";
import TextInput from "../../components/input-buttons/TextInput";
import TextInputLarge from "../../components/input-buttons/TextInputLarge";
import TextInputWithDropdown from "../../components/input-buttons/TextInputWithDropdown";
import { countries } from "../../config/countries-data"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCity,
  faComment,
  faEnvelope,
  faGlobe,
  faIdCard,
  faPhone,
  faSave,
  faSignsPost,
  faStreetView,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

const NAME_REGEX = /^[\p{L}\p{M}\s\d]{3,40}$/u;
const IDENTITY_DOCUMENT_REGEX = /^[A-Za-z0-9]{3,20}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const PHONE_NUMBER_REGEX = /^\+?\d{1,3}(?:[\s-]?\d{1,3}){2,}$/
const STREET_REGEX = /^[\p{L}\p{M}\d\s,-]{3,}$/u;
const CITY_REGEX = /^[\p{L}\p{M}\s]{3,}$/u;
const ZIP_CODE_REGEX = /^\d{5}(?:[-\s]\d{4})?$/

const NewClientForm = () => {
  const { t } = useTranslation(["translation"]);
  const { t: countriesT } = useTranslation(["countries"]);
  useTitle(t("private.new-client"));

  const [addNewClient, {
    isLoading,
    isSuccess,
    isError,
    error
  }] = useAddNewClientMutation();

  const navigate = useNavigate();

  const [identityDocument, setIdentityDocument] = useState('');
  const [validIdentityDocument, setValidIdentityDocument] = useState(false);
  const [name, setName] = useState('');
  const [validName, setValidName] = useState(false);
  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validPhoneNumber, setValidPhoneNumber] = useState(false);
  const [street, setStreet] = useState('');
  const [validStreet, setValidStreet] = useState(false);
  const [city, setCity] = useState('');
  const [validCity, setValidCity] = useState(false);
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [validZipCode, setValidZipCode] = useState(false);
  const [comment, setComment] = useState('')

  const countryNames = countries.map(country => ({
    name: `${country.code} | ${countriesT(`countries.${country.code}`)}`,
    value: country.code
  }));

  useEffect(() => {
    setValidName(NAME_REGEX.test(name))
  }, [name]);

  useEffect(() => {
    setValidIdentityDocument(identityDocument.trim().length === 0 || IDENTITY_DOCUMENT_REGEX.test(identityDocument));
  }, [identityDocument]);

  useEffect(() => {
    setValidEmail(!email || email.trim().length === 0 || EMAIL_REGEX.test(email));
  }, [email]);

  useEffect(() => {
    setValidPhoneNumber(!phoneNumber || phoneNumber.trim().length === 0 || PHONE_NUMBER_REGEX.test(phoneNumber));
  }, [phoneNumber]);

  useEffect(() => {
    setValidStreet(street.trim().length === 0 || STREET_REGEX.test(street));
  }, [street]);

  useEffect(() => {
    setValidCity(city.trim().length === 0 || CITY_REGEX.test(city));
  }, [city]);

  useEffect(() => {
    setValidZipCode(zipCode.trim().length === 0 || ZIP_CODE_REGEX.test(zipCode));
  }, [zipCode]);

  useEffect(() => {
    if (!isSuccess) return
    setIdentityDocument("");
    setName("");
    setEmail("");
    setPhoneNumber("");
    setStreet("");
    setCity("");
    setCountry("");
    setZipCode("");
    navigate(-1);

  }, [isSuccess, navigate]);

  const canSave =
    [validIdentityDocument,
      validName,
      validEmail,
      validPhoneNumber,
      validStreet,
      validCity,
      validZipCode].every(Boolean) && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return
    await addNewClient({
      identityDocument,
      name,
      email,
      phoneNumber,
      street,
      city,
      country,
      zipCode,
    });

  };


  const errClass = isError ? "errmsg" : "offscreen";

  return (
    <>
      <section className="content-grid">
        <form
          className="new-client__form"
          onSubmit={handleSubmit}
          action="none"
          method="POST"
        >
          <p className={errClass}>{error}</p>

          <div className="form__title-row">
            <h2>{t("private.new-client")}</h2>
          </div>

          <div className="form__row">
            <div className="form__column">
              <TextInput
                id="name"
                className={validName ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faUser} /> {t("private.name")}</>}
                defaultValue={name}
                onChange={(value) => setName(value)}
              />
              <TextInput
                id="email"
                type="email"
                className={validEmail ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faEnvelope} /> {t("private.email")}</>}
                defaultValue={email}
                onChange={(value) => setEmail(value)}
              />
              <TextInput
                id="phoneNumber"
                className={validPhoneNumber ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faPhone} /> {t("private.phone-number")}</>}
                defaultValue={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
              />
              <TextInput
                id="identityDocument"
                className={validIdentityDocument ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faIdCard} /> {t("private.identity-document")}</>}
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
                onChange={(value) => setCountry(value)}
                itemList={countryNames}
              />
              <TextInput
                id="city"
                className={validCity ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faCity} /> {t("private.city")}</>}
                defaultValue={city}
                onChange={(value) => setCity(value)}
              />
              <TextInput
                id="street"
                className={validStreet ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faStreetView} /> {t("private.street")}</>}
                defaultValue={street}
                onChange={(value) => setStreet(value)}
              />
              <TextInput
                id="zip-code"
                className={validZipCode ? "" : "invalid"}
                label={<><FontAwesomeIcon icon={faSignsPost} /> {t("private.zip-code")}</>}
                defaultValue={zipCode}
                onChange={(value) => setZipCode(value)}
              />
            </div>
          </div>
          <div className="form__column">
            <TextInputLarge
              id="comment"
              label={<><FontAwesomeIcon icon={faComment} /> {t("private.comment")}</>}
              defaultValue={comment}
              onChange={(value) => setComment(value)}
            />
          </div>


          <button
            className={`btn ${canSave ? "" : "disabled"}`}
            type="submit"
            formMethod="POST"
            disabled={!canSave}
          >
            {<><FontAwesomeIcon icon={faSave} /> {t("private.save")}</>}
          </button>
        </form>
      </section>
    </>
  );

};

export default NewClientForm;
