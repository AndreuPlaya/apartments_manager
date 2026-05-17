import { useRef, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from './authSlice'
import { useLoginMutation } from './authApiSlice'
import usePersist from '../../hooks/usePersist'
import useTitle from '../../hooks/useTitle'
import { useTranslation } from 'react-i18next'
import TextInput from "../../components/input-buttons/TextInput";
import ToggleButton from "../../components/input-buttons/ToggleButton";
import "./login.css"
import LoadingSpinner from '../../components/LoadingSpinner'
import { faArrowRightToBracket, faLock, faSave, faUser, faUserSecret } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Login = () => {

    const { t } = useTranslation(["translation"])
    useTitle(t("nav.log-in"))

    const errRef = useRef()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errMsg, setErrMsg] = useState('')
    const [persist, setPersist] = usePersist()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [login, { isLoading }] = useLoginMutation()



    useEffect(() => {
        setErrMsg('');
    }, [username, password])


    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const { accessToken } = await login({ username, password }).unwrap()
            dispatch(setCredentials({ accessToken, username }))
            setUsername('')
            setPassword('')
            navigate('/private/dashboard')
        } catch (err) {
            if (!err.status) {
                setErrMsg('No Server Response');
            } else if (err.status === 400) {
                setErrMsg('Missing Username or Password');
            } else if (err.status === 401) {
                setErrMsg('Unauthorized');
            } else {
                setErrMsg(err.data?.message);
            }
            errRef.current.focus();
        }
    }
    const handleToggle = (value) => {
        setPersist(value)
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <>
            <section className="content-grid">
                <div className="login__contianer">

                    <form
                        className="login__form"
                        onSubmit={handleSubmit}
                        action="none"
                        method="POST"
                    >
                        <div className="form__title-row">
                            <h2>{t("nav.log-in")}</h2>
                        </div>
                        <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                        <div className="form__column">
                            <TextInput
                                id="username"
                                type="text"
                                label={<><FontAwesomeIcon icon={faUser} /> {t("auth.username")}</>}
                                defaultValue={username}
                                onChange={(value) => setUsername(value)}
                            />
                            <TextInput
                                id="password"
                                type="password"
                                label={<><FontAwesomeIcon icon={faLock} /> {t("auth.password")}</>}
                                defaultValue={password}
                                onChange={(value) => setPassword(value)}
                            />
                        </div>

                        <div className="form__column">
                            <div className="form__btn-wrapper">
                                <button
                                    className={"btn"}
                                    type="submit"
                                    formMethod="POST"
                                >
                                    {<><FontAwesomeIcon icon={faArrowRightToBracket} /> {t("auth.sign-in")}</>}
                                </button>
                            </div>

                            <div className="form__row">
                                <ToggleButton
                                    id="persist"
                                    label={<> <FontAwesomeIcon icon={faSave} /> {t("auth.trust-this-device")} </>}
                                    defaultState={persist}
                                    onChange={handleToggle}
                                />


                                <Link className="dropdown-item" to="/register">{t("auth.not-registered")}</Link>
                            </div>

                        </div>





                    </form>

                </div>
            </section>
        </>
    )
}
export default Login