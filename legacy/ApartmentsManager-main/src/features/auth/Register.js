import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice';
import { useRegisterMutation } from './authApiSlice';
import useTitle from '../../hooks/useTitle';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';

const Register = () => {
  const { t } = useTranslation(['translation']);
  useTitle(t('nav.register'));

  const userRef = useRef();
  const errRef = useRef();
  const [username, setUsername] = useState('');
  const [validUsername, setValidUsername] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [validPassword, setValidPassword] = useState(false);
  const [validPasswordConfirmation, setValidPasswordConfirmation] = useState(false);
  const [email, setEmail] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [validEmail, setValidEmail] = useState(false);
  const [validEmailConfirmation, setValidEmailConfirmation] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [register, { isLoading }] = useRegisterMutation();

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [validUsername, validPassword, validEmail]);

  useEffect(() => {
    setValidUsername(username.trim().length > 3);
  }, [username]);

  useEffect(() => {
    setValidPassword(password.trim().length >= 8); // Example: Minimum password length of 8 characters
  }, [password]);

  useEffect(() => {
    setValidPasswordConfirmation(passwordConfirmation.trim() === password);
  }, [passwordConfirmation, password]);

  useEffect(() => {
    setValidEmail(validateEmail(email));
  }, [email]);

  useEffect(() => {
    setValidEmailConfirmation(emailConfirmation.trim() === email);
  }, [emailConfirmation, email]);

  const validateEmail = (value) => {
    // Example: Email validation using a regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const onSubmitClicked = async (e) => {
    e.preventDefault();
    try {
      const { accessToken } = await register({ username, password, email }).unwrap();
      dispatch(setCredentials({ accessToken }));
      setUsername('');
      setPassword('');
      setEmail('');
      navigate('/');
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
  };

  const onUsernameChanged = (e) => setUsername(e.target.value);
  const onPasswordChanged = (e) => setPassword(e.target.value);
  const onPasswordConfirmationChanged = (e) => setPasswordConfirmation(e.target.value);
  const onEmailChanged = (e) => setEmail(e.target.value);
  const onEmailConfirmationChanged = (e) => setEmailConfirmation(e.target.value);

  const canSave =
    validUsername && validPassword && validPasswordConfirmation && validEmail && validEmailConfirmation && !isLoading;

  const errClass = errMsg ? 'errmsg' : 'offscreen';
  const validUsernameClass = validUsername ? '' : 'form__input--incomplete';
  const validPasswordClass = validPassword ? '' : 'form__input--incomplete';
  const validPasswordConfirmationClass = validPasswordConfirmation ? '' : 'form__input--incomplete';
  const validEmailClass = validEmail ? '' : 'form__input--incomplete';
  const validEmailConfirmationClass = validEmailConfirmation ? '' : 'form__input--incomplete';

  if (isLoading) return <LoadingSpinner/>

  return (
    <section className="public">
      <main className="register">
        <p ref={errRef} className={errClass} aria-live="assertive">
          {errMsg}
        </p>

        <form className="form">
          <h2>{t('auth.register')}</h2>
          <label htmlFor="username">{t('auth.username')}:</label>
          <input
            className={`form__input ${validUsernameClass}`}
            type="text"
            id="username"
            ref={userRef}
            value={username}
            onChange={onUsernameChanged}
            autoComplete="off"
            required
          />

          <label htmlFor="password">{t('auth.password')}:</label>
          <input
            className={`form__input ${validPasswordClass}`}
            type="password"
            id="password"
            onChange={onPasswordChanged}
            value={password}
            required
          />
          <label htmlFor="passwordConfirmation">{t('auth.password-confirmation')}:</label>
          <input
            className={`form__input ${validPasswordConfirmationClass}`}
            type="password"
            id="passwordConfirmation"
            onChange={onPasswordConfirmationChanged}
            value={passwordConfirmation}
            required
          />
          <label htmlFor="email">{t('auth.email')}:</label>
          <input
            className={`form__input ${validEmailClass}`}
            type="email"
            id="email"
            onChange={onEmailChanged}
            value={email}
            required
          />
          <label htmlFor="emailConfirmation">{t('auth.email-confirmation')}:</label>
          <input
            className={`form__input ${validEmailConfirmationClass}`}
            type="email"
            id="emailConfirmation"
            onChange={onEmailConfirmationChanged}
            value={emailConfirmation}
            required
          />
          <button
            className="form__submit-button"
            title="Submit"
            onClick={onSubmitClicked}
            disabled={!canSave}
          >
            {t('auth.submit')}
          </button>
        </form>
      </main>
    </section>
  );
};

export default Register;
