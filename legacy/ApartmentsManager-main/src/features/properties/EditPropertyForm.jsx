import { useState, useEffect } from "react";
import { useUpdatePropertyMutation, useDeletePropertyMutation } from "./propertiesApiSlice";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useTitle from "../../hooks/useTitle";
import { useTranslation } from "react-i18next";
import { RENTAL_TYPES } from "../../config/rentalTypes"
import {
  FormContainer,
  Container,
  ElementWrapper,
  Label,
  Button,
  Input,
  InputComment,
  Select

} from "../../components/FormElements"
const EditPropertyForm = ({ property }) => {
  const [updateProperty, { isLoading, isSuccess, isError, error }] = useUpdatePropertyMutation();
  const [deleteProperty, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeletePropertyMutation();

  const { t } = useTranslation(["translation"])
  useTitle(t("private.edit-property"))

  const { isManager, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(property.name);
  const [validName, setValidName] = useState(false);

  const [address, setAddress] = useState(property.address);
  const [validAddress, setValidAddress] = useState(false);

  const [city, setCity] = useState(property.city);
  const [floor, setFloor] = useState(property.floor);
  const [door, setDoor] = useState(property.door);


  const [rentalType, setRentalType] = useState(property.rentalType);

  const [isAvailable, setIsAvailable] = useState(property.isAvailable);
  const [comment, setComment] = useState(property.comment);

  useEffect(() => {
    setValidName(name.trim().length > 3);
  }, [name]);

  useEffect(() => {
    setValidAddress(address.trim().length > 0);
  }, [address]);


  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      setName("");
      setAddress("");
      setDoor("");
      setFloor(0);
      setIsAvailable(false);
      navigate(-1);
    }
  }, [isSuccess, isDelSuccess, navigate]);


  const onSavePropertyClicked = async (e) => {
    if (!canSave) return
    await updateProperty({
      id: property.id,
      name,
      address,
      city,
      door,
      floor,
      rentalType,
      comment,
      isAvailable,
    });
  };

  const onDeletePropertyClicked = async () => {
    await deleteProperty({ id: property.id });
  };

  const canSave =
    [validName, validAddress].every(Boolean) && !isLoading;

  const errClass = (isError || isDelError) ? "errmsg" : "offscreen";
  const errContent = (error?.data?.message || delerror?.data?.message) ?? '';

  let deleteButton = null;
  if (isManager || isAdmin) {
    deleteButton = (
      <Button title="Delete" onClick={onDeletePropertyClicked}>
        {t("private.delete")}
      </Button>
    );
  }
  const options = Object.values(RENTAL_TYPES).map(role => {
    return (
      <option
        key={role}
        value={role}

      > {role}</option >
    )
  })
  return (
    <>
    <section className="edit__property">
    <div className="container edit__property-container">
      <p className={errClass}>{errContent}</p>

      <div className="form__title-row">
        <h2>{t("private.edit-property")}</h2>
      </div>
      <FormContainer onSubmit={onSavePropertyClicked}>
        <Container>
          <ElementWrapper>
            <Label>{t("private.name")}: <span className="nowrap">{t("private.name-description")}</span></Label>
            <Input
              isValid={validName}
              id="name"
              name="name"
              type="text"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

          </ElementWrapper>
          <ElementWrapper>
            <Label>{t("private.address")}:</Label>
            <Input
              isValid={validAddress}
              id="address"
              name="address"
              type="text"
              autoComplete="off"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

          </ElementWrapper>
          <ElementWrapper>
            <Label>{t("private.city")}:</Label>
            <Input
              isValid={true}
              id="city"
              name="city"
              type="text"
              autoComplete="off"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </ElementWrapper>
          <ElementWrapper>
            <Label>{t("private.floor")}:</Label>
            <Input
              isValid={true}
              id="floor"
              name="floor"
              type="text"
              autoComplete="off"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </ElementWrapper>
          <ElementWrapper>
            <Label>{t("private.door")}:</Label>
            <Input
              isValid={true}
              id="door"
              name="door"
              type="text"
              value={door}
              onChange={(e) => setDoor(e.target.value)}
            />

          </ElementWrapper>

        </Container>
        <Container>
          <ElementWrapper>
            <Label>{t("private.rental-type")}:</Label>
            <Select
              id="rental-type"
              name="rental-type"
              isValid={true}
              size={RENTAL_TYPES.length}
              value={rentalType}
              onChange={(e) => setRentalType(e.target.value)}
            >
              {options}
            </Select>
          </ElementWrapper>
          <ElementWrapper>
            <Label className="form__label" htmlFor="isAvailable">
              {t("private.available")}:
            </Label>
            <Input
              isValid="true"
              id="isAvailable"
              name="isAvailable"
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
          </ElementWrapper>
        </Container>
      </FormContainer >
      <FormContainer>
        <ElementWrapper>
          <Label>{t("private.comment")}:</Label>
          <InputComment
            type="text"
            autoComplete="off"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </ElementWrapper>
      </FormContainer>

      <FormContainer>
        <Button title="Save" onClick={onSavePropertyClicked} disabled={!canSave}>
          {t("private.save")}
        </Button>
        {deleteButton}
      </FormContainer>
      </div>
      </section>
    </>
  );
};

export default EditPropertyForm;
