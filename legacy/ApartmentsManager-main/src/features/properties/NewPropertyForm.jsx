import { useState, useEffect } from "react"
import { useAddNewPropertyMutation } from "./propertiesApiSlice"
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"
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
    Select

} from "../../components/FormElements"
const NewPropertyForm = () => {

    const [addNewProperty, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useAddNewPropertyMutation()

    const { t } = useTranslation(["translation"])
    useTitle(t("private.new-property"))
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [validName, setValidName] = useState(false);
    const [address, setAddress] = useState('');
    const [validAddress, setValidAddress] = useState(false);
    const [city, setCity] = useState('');
    const [floor, setFloor] = useState('');
    const [door, setDoor] = useState('');
    const [rentalType, setRentalType] = useState(RENTAL_TYPES.longTerm);
    const [comment, setComment] = useState('');

    useEffect(() => {
        setValidName(name.trim().length > 3);
    }, [name]);

    useEffect(() => {
        setValidAddress(address.trim().length > 0);
    }, [address]);


    const canSave =
        [validName, validAddress].every(Boolean) && !isLoading;

    useEffect(() => {
        if (!isSuccess) return
        setName("");
        setAddress("");
        setCity("")
        setDoor("");
        setFloor("");
        navigate(-1);

    }, [isSuccess, navigate]);




    const options = Object.values(RENTAL_TYPES).map(role => {
        return (
            <option
                key={role}
                value={role}

            > {role}</option >
        )
    })
    const onSavePropertyClicked = async (e) => {
        e.preventDefault();
        if (!canSave) return
        await addNewProperty({
            name,
            address,
            city,
            door,
            floor,
            rentalType,
            comment
        });

    }

    const errClass = isError ? "errmsg" : "offscreen"

    const content = (
        <>
            <section className="new__property">
                <div className="container new__property-container">
                    <p className={errClass}>{error?.data?.message}</p>

                    <div className="form__title-row">
                        <h2>{t("private.new-property")}</h2>
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
                                    onChange={(e) => setFloor(e.target.value)}
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
                                    autoComplete="off"
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
                    </FormContainer>
                </div>
            </section>
        </>
    )

    return content
}
export default NewPropertyForm