import { useState, useEffect } from "react"
import { useAddNewApartmentMutation } from "./apartmentsApiSlice"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import useTitle from "../../hooks/useTitle";
import {
    FormContainer,
    Container,
    ElementWrapper,
    Label,
    Button,
    Input,

} from "../../components/FormElements"
const NewApartmentForm = () => {

    const [addNewApartment, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useAddNewApartmentMutation()

    const { t } = useTranslation(["translation"])
    useTitle(t("private.new-apartment"))
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [validName, setValidName] = useState(false);

    const [address, setAddress] = useState('');
    const [validAddress, setValidAddress] = useState(false);

    const [price, setPrice] = useState('');
    const [validPrice, setValidPrice] = useState(false);

    const [maxGuests, setMaxGuests] = useState('');
    const [validMaxGuests, setValidMaxGuests] = useState(false);

    const [minNights, setMinNights] = useState(2);
    const [validMinNights, setValidMinNights] = useState(false);

    const [door, setDoor] = useState('');
    const [validDoor, setValidDoor] = useState(false);

    const [floor, setFloor] = useState('');
    const [validFloor, setValidFloor] = useState(false);

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
        setValidMaxGuests(maxGuests > 0);
    }, [maxGuests]);

    useEffect(() => {
        setValidMinNights(minNights > 0);
    }, [minNights]);

    useEffect(() => {
        setValidDoor(door.trim().length > 0);
    }, [door]);

    useEffect(() => {
        setValidFloor(floor > 0);
    }, [floor]);


    useEffect(() => {
        if (!isSuccess) return
        setName("");
        setAddress("");
        setPrice(0);
        setMaxGuests(0);
        setMinNights(0);
        setDoor("");
        setFloor(0);
        navigate(-1);

    }, [isSuccess, navigate]);

    const onNameChanged = (e) => setName(e.target.value);
    const onAddressChanged = (e) => setAddress(e.target.value);
    const onPriceChanged = (e) => setPrice(parseFloat(e.target.value));
    const onMaxGuestsChanged = (e) => setMaxGuests(parseInt(e.target.value));
    const onMinNightsChanged = (e) => setMinNights(parseInt(e.target.value));
    const onDoorChanged = (e) => setDoor(e.target.value);
    const onFloorChanged = (e) => setFloor(parseInt(e.target.value));

    const canSave =
        [validName, validAddress, validPrice, validMaxGuests, validMinNights, validDoor, validFloor].every(Boolean) && !isLoading;

    const onSaveApartmentClicked = async (e) => {
        e.preventDefault();
        if (!canSave) return
        await addNewApartment({
            name,
            address,
            price,
            maxGuests,
            minNights,
            door,
            floor
        });

    }

    const errClass = isError ? "errmsg" : "offscreen"

    const content = (
        <>
            <section className="new__apartment">
                <div className="container new__apartment-container">

                    <p className={errClass}>{error?.data?.message}</p>

                    <div className="form__title-row">
                        <h2>{t("private.new-apartment")}</h2>
                    </div>
                    <FormContainer onSubmit={onSaveApartmentClicked}>
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
                                    onChange={onNameChanged}
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
                                    onChange={onAddressChanged}
                                />

                            </ElementWrapper>
                            <ElementWrapper>
                                <Label>{t("private.floor")}:</Label>
                                <Input
                                    isValid={validFloor}
                                    id="floor"
                                    name="floor"
                                    type="number"
                                    min="0"
                                    value={floor}
                                    onChange={onFloorChanged}
                                />
                            </ElementWrapper>
                            <ElementWrapper>
                                <Label>{t("private.door")}:</Label>
                                <Input
                                    isValid={validDoor}
                                    id="door"
                                    name="door"
                                    type="text"
                                    autoComplete="off"
                                    value={door}
                                    onChange={onDoorChanged}
                                />

                            </ElementWrapper>

                        </Container>
                        <Container>
                            <ElementWrapper>
                                <Label>{t("private.price")}:</Label>
                                <Input
                                    isValid={validPrice}
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={onPriceChanged}
                                />

                            </ElementWrapper>
                            <ElementWrapper>
                                <Label>{t("private.max-guests")}:</Label>
                                <Input
                                    isValid={validMaxGuests}
                                    id="maxGuests"
                                    name="maxGuests"
                                    type="number"
                                    min="0"
                                    value={maxGuests}
                                    onChange={onMaxGuestsChanged}
                                />

                            </ElementWrapper>
                            <ElementWrapper>
                                <Label>{t("private.min-nights")}:</Label>
                                <Input
                                    isValid={validMinNights}
                                    id="minNights"
                                    name="minNights"
                                    type="number"
                                    min="0"
                                    value={minNights}
                                    onChange={onMinNightsChanged}
                                />
                            </ElementWrapper>
                        </Container>
                    </FormContainer >
                    <FormContainer>
                        <Button title="Save" onClick={onSaveApartmentClicked} disabled={!canSave}>
                            {t("private.save")}
                        </Button>
                    </FormContainer>
                </div>
            </section>
        </>
    )

    return content
}
export default NewApartmentForm