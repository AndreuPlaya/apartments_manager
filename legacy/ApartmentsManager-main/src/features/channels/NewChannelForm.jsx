import { useState, useEffect } from "react"
import { useAddNewChannelMutation } from './channelsApiSlice'
import { useNavigate } from "react-router-dom"
import useTitle from "../../hooks/useTitle";
import { useTranslation } from "react-i18next"

import {
    FormContainer,
    Container,
    ElementWrapper,
    Label,
    Input,
    Button,
} from "../../components/FormElements"

const CHANNEL_REGEX = /^[A-Za-z.]{3,20}$/;

const NewChannelForm = () => {
    const { t } = useTranslation(["translation"])
    useTitle(t("private.new-channel"));

    const [addNewChannel, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useAddNewChannelMutation()

    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [validName, setValidName] = useState(false)
    const [commissionRate, setCommissionRate] = useState(0)
    const [validCommissionRate, setValidCommissionRate] = useState(false)

    useEffect(() => {
        setValidName(CHANNEL_REGEX.test(name))
    }, [name])

    useEffect(() => {
        setValidCommissionRate(commissionRate >= 0 && commissionRate <= 100);
    }, [commissionRate]);

    useEffect(() => {
        if (isSuccess) {
            setName('')
            navigate(-1)
        }
    }, [isSuccess, navigate])


    let canSave = [validName].every(Boolean) && !isLoading

    const onSaveChannelClicked = async (e) => {
        e.preventDefault();
        if (!canSave) return
        await addNewChannel({ name, commissionRate })
    }

    const errClass = isError ? "errmsg" : "offscreen"

    return (
        <>
            <section className="new__channel-container">
                <div className="container new__channel-container">

                    <p className={errClass}>{error?.data?.message}</p>
                    <div>
                        <h2>{t("private.new-channel")}</h2>
                    </div>
                    <FormContainer onSubmit={onSaveChannelClicked}>
                        <Container>
                            <ElementWrapper>
                                <Label>
                                    {t("private.name")}: <span className="nowrap">{t("private.name-description")}</span></Label>
                                <Input
                                    isValid={validName}
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="off"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </ElementWrapper>
                            <ElementWrapper>

                                <Label>{t("private.commission-rate")}: <span className="nowrap">{t("private.commission-rate-description")}</span></Label>
                                <Input
                                    isValid={validCommissionRate}
                                    id="commissionRate"
                                    name="commissionRate"
                                    type="commissionRate"
                                    value={commissionRate}
                                    onChange={e => setCommissionRate(e.target.value)}
                                />
                            </ElementWrapper>
                        </Container>
                    </FormContainer>
                    <FormContainer>
                        <Button title="Save" onClick={onSaveChannelClicked} disabled={!canSave}>
                            {t("private.save")}
                        </Button>
                    </FormContainer>
                </div>
            </section>
        </>
    )
}
export default NewChannelForm
