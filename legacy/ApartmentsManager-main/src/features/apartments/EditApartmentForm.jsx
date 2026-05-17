import { useState, useEffect } from "react";
import { useUpdateApartmentMutation, useDeleteApartmentMutation } from "./apartmentsApiSlice";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useTitle from "../../hooks/useTitle";
import { useTranslation } from "react-i18next";
import ToggleButton from "../../components/input-buttons/ToggleButton";
import TextInput from "../../components/input-buttons/TextInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faSave,
  faTrash,
  faBuilding,
  faMapMarked,
  faDoorClosed,
  faMoon,
  faMoneyBillWave,
  faCalendarAlt,
  faDoorOpen,
  faBathtub,
  faUsers
} from "@fortawesome/free-solid-svg-icons";

const EditApartmentForm = ({ apartment }) => {
  const [updateApartment, { isLoading, isSuccess, isError, error }] = useUpdateApartmentMutation();
  const [deleteApartment, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeleteApartmentMutation();

  const { t } = useTranslation(["translation"])
  useTitle(t("private.edit-apartment"))
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isEditable, setIsEditable] = useState(false)
  const [name, setName] = useState(apartment.name);
  const [validName, setValidName] = useState(false);
  const [address, setAddress] = useState(apartment.address);
  const [validAddress, setValidAddress] = useState(false);
  const [price, setPrice] = useState(apartment.price);
  const [validPrice, setValidPrice] = useState(false);
  const [door, setDoor] = useState(apartment.door);
  const [validDoor, setValidDoor] = useState(false);
  const [floor, setFloor] = useState(apartment.floor);
  const [validFloor, setValidFloor] = useState(false);
  const [maxGuests, setMaxGuests] = useState(apartment.maxGuests);
  const [validMaxGuests, setValidMaxGuests] = useState(false);
  const [minNights, setMinNights] = useState(apartment.minNights);
  const [validMinNights, setValidMinNights] = useState(false);
  const [rooms, setRooms] = useState(apartment.rooms);
  const [validRooms, setValidRooms] = useState(false);
  const [bathrooms, setBathrooms] = useState(apartment.minNights);
  const [validBathrooms, setValidBathrooms] = useState(false);
  const [isAvailable, setIsAvailable] = useState(apartment.isAvailable);

  useEffect(() => {
    setValidName(name.trim().length > 3);
  }, [name]);

  useEffect(() => {
    setValidAddress(address.trim().length > 0);
  }, [address]);

  useEffect(() => {
    setValidPrice(price > 0);
  }, [price]);

  useEffect(() => {
    setValidDoor(door.trim().length > 0);
  }, [door]);

  useEffect(() => {
    setValidFloor(floor > 0);
  }, [floor]);

  useEffect(() => {
    setValidMaxGuests(maxGuests > 0);
  }, [maxGuests]);

  useEffect(() => {
    setValidMinNights(minNights > 0);
  }, [minNights]);

  useEffect(() => {
    setValidRooms(rooms > 0);
  }, [rooms]);

  useEffect(() => {
    setValidBathrooms(bathrooms > 0);
  }, [bathrooms]);

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      setName("");
      setAddress("");
      setPrice(0);
      setMaxGuests(0);
      setMinNights(0);
      setDoor("");
      setFloor(0);
      setIsAvailable(false);
      navigate(-1);
    }
  }, [isSuccess, isDelSuccess, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!canSave) return
    await updateApartment({
      id: apartment.id,
      name,
      address,
      price,
      maxGuests,
      minNights,
      door,
      floor,
      rooms,
      bathrooms,
      isAvailable,
    });
  };

  const onDeleteClicked = async () => {
    await deleteApartment({ id: apartment.id });
  };
  const toggleEdit = (value) => {
    setIsEditable(value)
  }
  const toggleAvailable = (value) => {
    setIsAvailable(value)
  }
  const canSave =
    [validName, validAddress, validPrice, validMaxGuests, validMinNights, validDoor, validFloor].every(Boolean) && !isLoading;

  const errClass = (isError || isDelError) ? "errmsg" : "offscreen";
  const errContent = (error?.data?.message || delerror?.data?.message) ?? '';



  return (
    <section className="content-grid">

      <form
        className="edit-apartment__form"
        onSubmit={handleSubmit}
        action="none"
        method="PATCH"
      >

        <p className={errClass}>{errContent}</p>

        <div className="form__title-row">
          <h2>{`${t("private.edit-apartment")} ${apartment.id}`}</h2>
          {isAdmin && <ToggleButton
            label={<> <FontAwesomeIcon icon={faEdit} /> {t("private.edit")} </>}
            onChange={toggleEdit}
          >
          </ToggleButton>}
        </div>
        <div className="form__row">
          <div className="form__column">
            <TextInput
              id="name"
              className={validName ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faBuilding} /> {t("private.name")}: <span className="nowrap">{t("private.name-description")}</span></>}
              disabled={!isEditable}
              defaultValue={name}
              onChange={(value) => setName(value)}
            />
            <TextInput
              id="address"
              className={validAddress ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faMapMarked} /> {t("private.address")}</>}
              disabled={!isEditable}
              defaultValue={address}
              onChange={(value) => setAddress(value)}
            />
            <TextInput
              id="floor"
              className={validFloor ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faBuilding} /> {t("private.floor")}</>}
              disabled={!isEditable}
              defaultValue={floor}
              onChange={(value) => setFloor(value)}
            />
            <TextInput
              id="door"
              className={validDoor ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faDoorClosed} /> {t("private.door")}</>}
              disabled={!isEditable}
              defaultValue={door}
              onChange={(value) => setDoor(value)}
            />
            <TextInput
              id="price"
              className={validPrice ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faMoneyBillWave} /> / <FontAwesomeIcon icon={faMoon} /> {t("private.price")}</>}
              disabled={!isEditable}
              defaultValue={price}
              onChange={(value) => setPrice(value)}
            />
          </div>
          <div className="form__column">

            <TextInput
              id="min-nights"
              className={validMinNights ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faCalendarAlt} /> {t("private.min-nights")}</>}
              disabled={!isEditable}
              defaultValue={minNights}
              onChange={(value) => setMinNights(value)}
            />
            <TextInput
              id="rooms"
              className={validRooms ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faDoorOpen} /> {t("private.rooms")}</>}
              disabled={!isEditable}
              defaultValue={rooms}
              onChange={(value) => setRooms(value)}
            />
            <TextInput
              id="bathrooms"
              className={validBathrooms ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faBathtub} /> {t("private.bathrooms")}</>}
              disabled={!isEditable}
              defaultValue={bathrooms}
              onChange={(value) => setBathrooms(value)}
            />
            <TextInput
              id="max-guests"
              className={validMaxGuests ? "" : "invalid"}
              label={<><FontAwesomeIcon icon={faUsers} /> {t("private.max-guests")}</>}
              disabled={!isEditable}
              defaultValue={maxGuests}
              onChange={(value) => setMaxGuests(value)}
            />
            <ToggleButton
              id="available"
              label={<> <FontAwesomeIcon icon={faEdit} /> {t("private.available")} </>}
              defaultState={isAvailable}
              disabled={!isEditable}
              onChange={toggleAvailable}
            />
          </div>
        </div>
        <div className="form__btn-wrapper">
          {(isAdmin && isEditable) && <button
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
  );
};

export default EditApartmentForm;
