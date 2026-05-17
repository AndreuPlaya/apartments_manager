import { useState, useEffect } from "react"
import { useUpdateUserMutation, useDeleteUserMutation } from "./usersApiSlice"
import { useNavigate } from "react-router-dom"
import { ROLES } from "../../config/roles"
import useTitle from "../../hooks/useTitle"
import useAuth from "../../hooks/useAuth";
import { useTranslation } from "react-i18next"
import ToggleButton from "../../components/input-buttons/ToggleButton";
import TextInput from "../../components/input-buttons/TextInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faEnvelope,
    faSave,
    faTrash,
    faUser
} from "@fortawesome/free-solid-svg-icons";

const USER_REGEX = /^[A-z]{3,20}$/
const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const EditUserForm = ({ user }) => {
    const { t } = useTranslation(["translation"]);
    useTitle(t("private.edit-user"))

    const [updateUser, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useUpdateUserMutation()

    const [deleteUser, {
        isSuccess: isDelSuccess,
        isError: isDelError,
        error: delerror
    }] = useDeleteUserMutation()

    const { isAdmin } = useAuth();
    const navigate = useNavigate()

    const [isEditable, setIsEditable] = useState(false)
    const [name, setName] = useState(user.username)
    const [validName, setValidName] = useState(false)
    const [password, setPassword] = useState('')
    const [validPassword, setValidPassword] = useState(false)
    const [email, setEmail] = useState(user.email)
    const [validEmail, setValidEmail] = useState(false)
    const [roles, setRoles] = useState(user.roles)
    const [active, setActive] = useState(user.active)

    useEffect(() => {
        setValidName(USER_REGEX.test(name))
    }, [name])

    useEffect(() => {
        setValidPassword(PWD_REGEX.test(password) || !password)
    }, [password])

    useEffect(() => {
        setValidEmail(EMAIL_REGEX.test(email))
    }, [email])

    useEffect(() => {
        if (isSuccess || isDelSuccess) {
            navigate(-1)
        }

    }, [isSuccess, isDelSuccess, navigate])

    const toggleEdit = (value) => {
        setIsEditable(value)
    }

    const toggleActive = (value) => {
        setActive(value)
    }

    const onRolesChanged = e => {
        const values = Array.from(
            e.target.selectedOptions,
            (option) => option.value
        )
        setRoles(values)
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSave) return
        if (password) {
            await updateUser({ id: user.id, username: name, password, roles, email, active })
        } else {
            await updateUser({ id: user.id, username: name, roles, email, active })
        }
    }

    const onDeleteClicked = async () => {
        await deleteUser({ id: user.id })
    }

    const options = Object.values(ROLES).map(role => {
        return (
            <option
                key={role}
                value={role}

            > {role}</option >
        )
    })

    let canSave
    if (password) {
        canSave = [roles.length, validName, validPassword, validEmail].every(Boolean) && !isLoading
    } else {
        canSave = [roles.length, validName, validEmail].every(Boolean) && !isLoading
    }

    const errClass = (isError || isDelError) ? "errmsg" : "offscreen"
    const validRoles = Boolean(roles.length)

    const errContent = (error?.data?.message || delerror?.data?.message) ?? ''

    const content = (
        <section className="content-grid">

            <form
                className="edit-user__form"
                onSubmit={handleSubmit}
                action="none"
                method="PATCH"
            >

                <p className={errClass}>{errContent}</p>

                <div className="form__title-row">
                    <h2>{`${t("private.edit-user")} ${user.id}`}</h2>
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
                            label={<><FontAwesomeIcon icon={faUser} /> {t("private.name")}: <span className="nowrap">{t("private.name-description")}</span></>}
                            disabled={!isEditable}
                            defaultValue={name}
                            onChange={(value) => setName(value)}
                        />
                        <TextInput
                            id="password"
                            type="password"
                            className={validPassword ? "" : "invalid"}
                            label={<><FontAwesomeIcon icon={faEnvelope} /> {t("private.password")}: <span className="nowrap">{t("private.password-description")}</span></>}
                            disabled={!isEditable}
                            onChange={(value) => setPassword(value)}
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

                    </div>
                    <div className="form__column">
                        <ToggleButton
                            id="user-active"
                            label={<> <FontAwesomeIcon icon={faEdit} /> {t("private.active")} </>}
                            defaultState={active}
                            disabled={!isEditable}
                            onChange={toggleActive}
                        />
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
    )

    return content
}
export default EditUserForm