import React from 'react'
import Slideshow from './Slideshow'
import { useNavigate } from 'react-router-dom'; // Import the useHistory hook
import RoomSearchBar from './room-search/RoomSearchBar'
import { useTranslation } from "react-i18next"
import { heroImages } from "../config/data";

const MainHeader = () => {
    const { t } = useTranslation(['translation']);
    const navigate = useNavigate(); // Initialize the useHistory hook

    const onSubmit = (formData) => {
        navigate('/rooms', { state: { formData } });
    };
    return (
        <header className='main__header'>
            <div className="main__header-container">
                <div className="main__header-bg">
                    <Slideshow images={heroImages} />
                </div>
                <div className="main__header-overlay">
                    <div className="main__header-text">
                        <h1>{t('home.call-to-action')}</h1>
                    </div>

                    <div className="main__header-search">
                        <RoomSearchBar className={"room-search"} onSubmit={onSubmit} />
                    </div>
                </div>
            </div>

        </header>
    )
}




export default MainHeader