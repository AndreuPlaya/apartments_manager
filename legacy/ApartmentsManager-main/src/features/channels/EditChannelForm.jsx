import { useState, useEffect } from "react"
import { useUpdateChannelMutation, useDeleteChannelMutation } from "./channelsApiSlice"
import { useNavigate } from "react-router-dom"
import useAuth from "../../hooks/useAuth";
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

const EditChannelForm = ({ channel }) => {

    const [updateChannel, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useUpdateChannelMutation()

    const [deleteChannel, {
        isSuccess: isDelSuccess,
        isError: isDelError,
        error: delerror
    }] = useDeleteChannelMutation()

    const { t } = useTranslation(["translation"])
    useTitle(t("private.edit-channel"));
    const navigate = useNavigate()

    const { isManager, isAdmin } = useAuth();

    const [name, setName] = useState(channel.name)
    const [validName, setValidName] = useState(false)
    const [commissionRate, setCommissionRate] = useState(channel.commissionRate)
    const [validCommissionRate, setValidCommissionRate] = useState(false)

    useEffect(() => {
        setValidName(CHANNEL_REGEX.test(name))
    }, [name])

    useEffect(() => {
        setValidCommissionRate(commissionRate >= 0 && commissionRate <= 100);
    }, [commissionRate]);


    useEffect(() => {
        if (isSuccess || isDelSuccess) {
            setName('')
            navigate(-1)
        }

    }, [isSuccess, isDelSuccess, navigate])


    const onSaveChannelClicked = async (e) => {
        if (!canSave)
            return
        await updateChannel({ id: channel.id, name, commissionRate })

    }

    const onDeleteChannelClicked = async () => {
        await deleteChannel({ id: channel.id })
    }



    let canSave = [validName, validCommissionRate].every(Boolean) && !isLoading


    const errClass = (isError || isDelError) ? "errmsg" : "offscreen"

    const errContent = (error?.data?.message || delerror?.data?.message) ?? ''
    let deleteButton = null;
    if (isManager || isAdmin) {
        deleteButton = (
            <Button title="Delete" onClick={onDeleteChannelClicked}>
                {t("private.delete")}
            </Button>
        );
    }
    return (
        <>
        <section className="edit__channel">
            <div className="container edit-channel-container">
                
            <p className={errClass}>{errContent}</p>

            <div>
                <h2>{t("private.edit-channel")}</h2>
            </div>

            <FormContainer className="form" onSubmit={e => e.preventDefault()}>
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
                {deleteButton}
            </FormContainer>
            </div>
        </section>
        </>
    )
}
export default EditChannelForm