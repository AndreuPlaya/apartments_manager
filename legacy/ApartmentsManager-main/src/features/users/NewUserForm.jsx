import { useState, useEffect } from "react"
import { useAddNewUserMutation } from "./usersApiSlice"
import { useNavigate } from "react-router-dom"
import { ROLES } from "../../config/roles"
import useTitle from "../../hooks/useTitle"
import { useTranslation } from "react-i18next"
import TextInput from "../../components/input-buttons/TextInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faSave,
    faUser
} from "@fortawesome/free-solid-svg-icons";

const USER_REGEX = /^[A-z]{3,20}$/
const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const NewUserForm = () => {
    const { t } = useTranslation(["translation"]);
    useTitle(t("private.new-user"))

    const [addNewUser, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useAddNewUserMutation()

    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [validName, setValidName] = useState(false)
    const [password, setPassword] = useState('')
    const [validPassword, setValidPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [validEmail, setValidEmail] = useState(false)
    const [roles, setRoles] = useState(["Guest"])

    useEffect(() => {
        setValidName(USER_REGEX.test(name))
    }, [name])

    useEffect(() => {
        setValidPassword(PWD_REGEX.test(password))
    }, [password])

    useEffect(() => {
        setValidEmail(EMAIL_REGEX.test(email))
    }, [email])

    useEffect(() => {
        if (!isSuccess) return
        
        setName('')
        setPassword('')
        setRoles([])
        navigate(-1)

    }, [isSuccess, navigate])

    const onRolesChanged = e => {
        const values = Array.from(
            e.target.selectedOptions, //HTMLCollection 
            (option) => option.value
        )
        setRoles(values)
    }

    const canSave = [roles.length, validName, validPassword, validEmail].every(Boolean) && !isLoading

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSave) return
        await addNewUser({ username: name, password, email, roles })

    }

    const options = Object.values(ROLES).map(role => {
        return (
            <option
                key={role}
                value={role}

            > {role}</option >
        )
    })

    const errClass = isError ? "errmsg" : "offscreen"
    const validRoles = Boolean(roles.length)

    const content = (
        <section className="content-grid">

            <form
                className="new-user__form"
                onSubmit={handleSubmit}
                action="none"
                method="POST"
            >

                <p className={errClass}>{error}</p>

                <div className="form__title-row">
                    <h2>{t("private.new-user")}</h2>
                </div>
                <div className="form__row">
                    <div className="form__column">
                        <TextInput
                            id="name"
                            className={validName ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faUser} /> {t("private.name")}: <span className="nowrap">{t("private.name-description")}</span></>}
                            defaultValue={name}
                            onChange={(value) => setName(value)}
                        />
                        <TextInput
                            id="password"
                            type="password"
                            className={validPassword ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faEnvelope} /> {t("private.password")}: <span className="nowrap">{t("private.password-description")}</span></>}
                            onChange={(value) => setPassword(value)}
                        />
                        <TextInput
                            id="email"
                            type="email"
                            className={validEmail ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faEnvelope} /> {t("private.email")}</>}
                            defaultValue={email}
                            onChange={(value) => setEmail(value)}
                        />

                    </div>
                    <div className="form__column">
                        <div>
                            <label>{t("private.assigned-roles")}:</label>
                            <select
                                id="roles"
                                name="roles"
                                isValid={validRoles}
                                multiple={true}
                                size="4"
                                value={roles}
                                onChange={onRolesChanged}
                            >
                                {options}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="form__btn-wrapper">
                    <button
                        className={`btn ${canSave ? "" : "disabled"}`}
                        type="submit"
                        formMethod="POST"
                        disabled={!canSave}
                    >
                        {<><FontAwesomeIcon icon={faSave} /> {t("private.save")}</>}
                    </button>
                </div>
            </form>
        </section>
    )

    return content
}
export default NewUserForm
