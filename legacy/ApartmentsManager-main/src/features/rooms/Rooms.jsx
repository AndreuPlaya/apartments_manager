import { useTranslation } from 'react-i18next';
import useTitle from '../../hooks/useTitle';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import HeaderImage from '../../assets/images/sight_manresa_01.jpg';
import RoomCard from '../../components/room-card/RoomCardResult';
import RoomSearchBar from '../../components/room-search/RoomSearchBar';
import './rooms.css';

const Rooms = () => {
    const { t } = useTranslation(['translation']);
    useTitle(t('nav.apartments'));
    const location = useLocation();
    const formData = location.state?.formData || {};
    const [availableApartments, setAvailableApartments] = useState([]);

    const handleSearchResults = (results) => {
        console.log(availableApartments)
        setAvailableApartments(results);
    };

    useEffect(() => {
        if (!formData) return

        if (Object.keys(formData).length <= 0) return

        handleSubmit(formData);

    }, [formData]);

    const handleSubmit = (formData) => {
        const apiUrl = process.env.REACT_APP_API_URL;
        if (!apiUrl) {
            console.error('REACT_APP_API_URL is not set in the environment variables.');
            return;
        }
        if (!formData) {
            console.error('form data is null');
            return;
        }

        if (Object.keys(formData).length <= 0) {
            console.error('form data is empty');
            return;
        }

        fetch(`${apiUrl}/bookings/checkAvailability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    handleSearchResults(data);
                } else {
                    console.error('Error: Data is not an array');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    return (
        <>
            <Header title={t('nav.apartments')} image={HeaderImage}></Header>

            <div className="container rooms-info__container">
                <div className="rooms-info__search">
                    <RoomSearchBar onSubmit={handleSubmit} defaultData={formData} />
                </div>
                <div className="rooms__available">
                    {availableApartments.length > 0 ? (
                        availableApartments.map((apartment, index) => (
                            <RoomCard key={index} room={apartment} />
                        ))
                    ) : (
                        <h2>No available rooms</h2>
                    )}
                </div>
            </div>
        </>
    );
};

export default Rooms;
