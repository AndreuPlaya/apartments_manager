import i18next from "i18next"
import backend from "i18next-http-backend"
import detector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
const langDetectorOptions = {
    // order and from where user language should be detected
    order: ['cookie', 'localStorage', 'navigator'],

    // keys or params to lookup language from
    lookupCookie: 'locale',
    lookupLocalStorage: 'locale',

    // cache user language on
    caches: ['localStorage', 'cookie'],
    excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)

};

i18next
    .use(initReactI18next)
    .use(detector)
    .use(backend)
    .init({
        debug: true,
        fallbackLng: "en",
        detection: langDetectorOptions,
        interpolation: {
            escapeValue: false
        },
        backend: {
            loadPath: "/assets/locales/{{lng}}/{{ns}}.json",
        },
    })

export default i18next