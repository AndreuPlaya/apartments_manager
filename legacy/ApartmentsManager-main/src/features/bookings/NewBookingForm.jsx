import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewBookingMutation } from "./bookingsApiSlice";
import { useTranslation } from "react-i18next";
import useTitle from "../../hooks/useTitle";

import CalendarInput from "../../components/input-buttons/CalendarInput"
import TextInput from "../../components/input-buttons/TextInput";
import TextInputWithSuggestions from "../../components/input-buttons/TextInputWithSuggestions";
import TextInputLarge from "../../components/input-buttons/TextInputLarge";
import CurrencyInput from "../../components/input-buttons/CurrencyInput";
import Dropdown from "../../components/input-buttons/Dropdown";
import GuestSelectorButton from "../../components/input-buttons/GuestSelectorButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowsToCircle,
    faBuilding,
    faCalendarAlt,
    faComment,
    faEnvelope,
    faEuro,
    faIdCard,
    faMoneyBill,
    faPhone,
    faSave,
    faUser,
    faUsers
}
    from "@fortawesome/free-solid-svg-icons";

const NAME_REGEX = /^[\p{L}\p{M}\s\d]{3,40}$/u;
const IDENTITY_DOCUMENT_REGEX = /^[A-Za-z0-9]{3,20}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const PHONE_NUMBER_REGEX = /^\+?\d{1,3}(?:[\s-]?\d{1,3}){2,}$/

const NewBookingForm = ({ apartments, clients, channels }) => {
    const { t } = useTranslation(["translation"]);
    useTitle(t("private.new-booking"));
    const [addNewBooking, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useAddNewBookingMutation();

    const navigate = useNavigate();


    const today = new Date();
    const checkinDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const checkoutDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
    const [name, setName] = useState('');
    const [validName, setValidName] = useState(false);
    const [apartmentId, setApartmentId] = useState(apartments[0]._id);
    const [channelId, setChannelId] = useState(channels[0]._id);
    const [clientId, setClientId] = useState('');
    const [adultCount, setAdultCount] = useState(2);
    const [totalAmmountDue, setTotalAmmountDue] = useState('')
    const [validTotalAmmountDue, setValidTotalAmmountDue] = useState(false)
    const [validAdultCount, setValidAdultCount] = useState(false);
    const [childrenCount, setChildrenCount] = useState(0);
    const [validChildrenCount, setValidChildrenCount] = useState(false);
    const [fromDate, setFromDate] = useState(checkinDate)
    const [validFromDate, setValidFromDate] = useState(false);
    const [toDate, setToDate] = useState(checkoutDate)
    const [minChekoutDate, setMinChekoutDate] = useState(checkoutDate)
    const [validToDate, setValidToDate] = useState(false);
    const [comment, setComment] = useState('')
    const [identityDocument, setIdentityDocument] = useState('');
    const [validIdentityDocument, setValidIdentityDocument] = useState(false);
    const [email, setEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [validPhoneNumber, setValidPhoneNumber] = useState(false);

    useEffect(() => {
        if (!isSuccess) return;
        setApartmentId("");
        setChannelId("");
        setClientId("");
        setAdultCount(0);
        setChildrenCount(0);
        setComment("");
        setTotalAmmountDue(0);
        navigate(-1);
    }, [isSuccess, navigate]);

    useEffect(() => {
        setValidName(NAME_REGEX.test(name));
    }, [name]);

    useEffect(() => {
        setValidIdentityDocument(!identityDocument || identityDocument?.trim().length === 0 || IDENTITY_DOCUMENT_REGEX.test(identityDocument));
    }, [identityDocument]);

    useEffect(() => {
        setValidEmail(!email || email?.trim().length === 0 || EMAIL_REGEX.test(email));
    }, [email]);

    useEffect(() => {
        setValidPhoneNumber(!phoneNumber || phoneNumber?.trim().length === 0 || PHONE_NUMBER_REGEX.test(phoneNumber));
    }, [phoneNumber]);

    useEffect(() => {
        const apartment = apartments.find(apartment => apartment._id === apartmentId);
        const maxGuests = apartment?.maxGuests || 1;
        setValidAdultCount(adultCount >= 1 && adultCount <= maxGuests);
    }, [adultCount, apartmentId, apartments]);

    useEffect(() => {
        setValidChildrenCount(childrenCount >= 0);
    }, [childrenCount]);

    useEffect(() => {
        if (!totalAmmountDue) {
            setValidTotalAmmountDue(true);
            return
        }
        setValidTotalAmmountDue(totalAmmountDue?.replace(',', '.') >= 0);
    }, [totalAmmountDue]);

    useEffect(() => {
        setValidFromDate(fromDate);
    }, [fromDate]);

    useEffect(() => {
        const apartment = apartments.find(apartment => apartment._id === apartmentId);
        const minNights = apartment?.minNights || 1;
        const minCheckOutDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + minNights);
        const checkOutDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        setMinChekoutDate(minCheckOutDate)
        if (checkOutDate.getTime() >= minCheckOutDate.getTime()) {
            setValidToDate(true);
        }
        else {
            setToDate(minCheckOutDate)
            setValidToDate(false);
        }
    }, [fromDate, toDate, apartmentId, apartments]);

    useEffect(() => {
        const client = clients.find(client => client.id === clientId);
        if (client) {
            setName(client.name);
        }
    }, [clientId, clients]);

    const canSave =
        [apartmentId,
            channelId,
            clientId || validName,
            validEmail,
            validPhoneNumber,
            validIdentityDocument,
            validAdultCount,
            validChildrenCount,
            validFromDate,
            validToDate].every(Boolean) && !isLoading;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSave) return

        await addNewBooking({
            apartmentId,
            channelId,
            clientId,
            clientName: name,
            email,
            phoneNumber,
            identityDocument,
            adultCount,
            childrenCount,
            fromDate,
            toDate,
            totalAmmountDue,
            comment: comment
        });
    };


    const onApartmentChanged = (apartment) => {
        setApartmentId(apartment.id)
    };
    const onChannelChanged = (channel) => {
        setChannelId(channel.id)
    }

    const onCheckinChanged = (value) => {
        const date = new Date(value.getFullYear(), value.getMonth(), value.getDate())
        setFromDate(date)
    }
    const onCheckoutChanged = (value) => {
        const date = new Date(value.getFullYear(), value.getMonth(), value.getDate())
        setToDate(date)
    }
    const selectClient = (client) => {

        if (!client) return;

        const { id, name, email, phoneNumber, identityDocument } = client;

        setClientId(id || '');
        setName(name || '');
        setEmail(email || '');
        setPhoneNumber(phoneNumber || '');
        setIdentityDocument(identityDocument || '');
    };
    const errClass = isError ? "errmsg" : "offscreen";
    const errContent = (error?.data?.message) ?? ''

    return (

        <section className="content-grid">

            <form
                className="new-booking__form"
                onSubmit={handleSubmit}
                action="none"
                method="POST"
            >

                <p className={errClass}>{errContent}</p>

                <div className="form__title-row">
                    <h2>{t("private.new-booking")}</h2>
                </div>

                <div className="form__row">
                    <div className="form__column">
                        <Dropdown
                            id="apartment"
                            label={<><FontAwesomeIcon icon={faBuilding} /> {t("private.apartment")}</>}
                            defaultValue={apartments[0]}
                            onChange={onApartmentChanged}
                            itemList={apartments}
                        />

                        <div className="form__row double-item">
                            <CalendarInput
                                id={"checkin"}
                                className={validFromDate ? "" : "invalid"}
                                label={<><FontAwesomeIcon icon={faCalendarAlt} /> {t("private.checkin")}</>}
                                defaultDate={fromDate}
                                onSelection={onCheckinChanged}
                            />
                            <CalendarInput
                                id={"checkout"}
                                className={validToDate ? "" : "invalid"}
                                label={<><FontAwesomeIcon icon={faCalendarAlt} /> {t("private.checkout")}</>}
                                defaultDate={toDate}
                                minDate={minChekoutDate}
                                onSelection={onCheckoutChanged}
                            />
                        </div>
                        <GuestSelectorButton
                            id="guests"
                            label={<><FontAwesomeIcon icon={faUsers} /> {t("searchbar.guests")}</>}
                            defaultAdults={adultCount}
                            defaultChildren={childrenCount}
                            onAdultsChange={setAdultCount}
                            onChildrenChange={setChildrenCount}
                        />

                        <Dropdown
                            id="channel"
                            label={<><FontAwesomeIcon icon={faArrowsToCircle} /> {t("private.channel")}</>}
                            defaultValue={channels[0]}
                            onChange={onChannelChanged}
                            itemList={channels}
                        />

                        <CurrencyInput
                            id="ammount-due"
                            className={validTotalAmmountDue ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faMoneyBill} /> {t("private.total-ammount-due")}</>}
                            defaultValue={totalAmmountDue}
                            coinSymbol={<FontAwesomeIcon icon={faEuro} />}
                            onChange={(value) => setTotalAmmountDue(value)}
                        />
                    </div>

                    <div className="form__column">
                        <TextInputWithSuggestions
                            id="name"
                            items={clients}
                            className={validName ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faUser} /> {t("private.name")}</>}
                            defaultValue={name}
                            onSelection={(value) => selectClient(value)}
                        />
                        <TextInput
                            id="email"
                            type="email"
                            className={validEmail ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faEnvelope} /> {t("private.email")}</>}
                            defaultValue={email}
                            disabled={clientId !== ''}
                            onChange={(value) => setEmail(value)}
                        />
                        <TextInput
                            id="phoneNumber"
                            className={validPhoneNumber ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faPhone} /> {t("private.phone-number")}</>}
                            defaultValue={phoneNumber}
                            disabled={clientId !== ''}
                            onChange={(value) => setPhoneNumber(value)}
                        />
                        <TextInput
                            id="identityDocument"
                            className={validIdentityDocument ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faIdCard} /> {t("private.identity-document")}</>}
                            defaultValue={identityDocument}
                            disabled={clientId !== ''}
                            onChange={(value) => setIdentityDocument(value)}
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
            </form >
        </section >

    );
};

export default NewBookingForm;
