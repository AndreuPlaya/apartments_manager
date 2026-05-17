import React, { useState, useEffect } from 'react';
import DatePicker from '../date-picker/DatePicker';
import GuestsPicker from '../guest-picker/GuestsPicker';
import { useTranslation } from 'react-i18next';
import { monthNames } from '../../config/data';

import RoomSearchItem from './RoomSearchItem';
import "./room-search-bar.css";


const RoomSearchBar = ({ defaultData, onSubmit }) => {
  const { t } = useTranslation(['translation']);
  const today = new Date();
  const defaultCheckinDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const defaultCheckoutDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
  const [checkinDate, setCheckinDate] = useState(defaultCheckinDate);
  const [checkoutDate, setCheckoutDate] = useState(defaultCheckoutDate);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [isCheckinDatePickerVisible, setCheckinDatePickerVisible] = useState(false);
  const [isCheckoutDatePickerVisible, setCheckoutDatePickerVisible] = useState(false);
  const [isGuestPickerVisible, setGuestPickerVisible] = useState(false);

  useEffect(() => {
    // Set initial state only once
    if (defaultData) {
      setCheckinDate(defaultData.checkinDate || defaultCheckinDate);
      setCheckoutDate(defaultData.checkoutDate || defaultCheckoutDate);
      setAdults(defaultData.adults || 1);
      setChildren(defaultData.children || 0);
    }
  }, [defaultData]);

  const handleCheckinChange = (date) => {
    const minCheckout = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2);

    if (checkoutDate.getTime() < minCheckout.getTime()) {
      setCheckoutDate(minCheckout);
    }

    setCheckinDatePickerVisible(false);
    setCheckinDate(date);
  };

  const handleCheckoutChange = (date) => {
    const minCheckin = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2);

    if (checkinDate.getTime() > minCheckin.getTime()) {
      setCheckinDate(minCheckin);
    }

    setCheckoutDatePickerVisible(false);
    setCheckoutDate(date);
  };

  const handleAdultsChange = (count) => {
    setAdults(count);
  };

  const handleChildrenChange = (count) => {
    setChildren(count);
  };

  const toggleCheckinDatePickerVisibility = () => {
    setCheckinDatePickerVisible(!isCheckinDatePickerVisible);
    setCheckoutDatePickerVisible(false);
    setGuestPickerVisible(false);
  };

  const toggleCheckoutDatePickerVisibility = () => {
    setCheckinDatePickerVisible(false);
    setCheckoutDatePickerVisible(!isCheckoutDatePickerVisible);
    setGuestPickerVisible(false);
  };
  const toggleGuestPickerVisibility = () => {
    setCheckinDatePickerVisible(false);
    setCheckoutDatePickerVisible(false);
    setGuestPickerVisible(!isGuestPickerVisible);
  };
  const getGuestsString = () => {
    return `${t('searchbar.adults').toLocaleUpperCase()} ${adults}  ${t('searchbar.children').toLocaleUpperCase()} ${children}`;
  };

  const getDateStringFromDate = (date) => {
    return `${date.getDate()} ${t(monthNames[date.getMonth()]).toLocaleUpperCase().substring(0, 3)} ${date.getFullYear()}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      checkinDate,
      checkoutDate,
      adults,
      children,
    };
    onSubmit(formData);
  };

  return (
    <div className={'room-search__container'}>
      <form 
      className={'room-search__form'}
      action='none'
      method='POST'
      onSubmit={handleSubmit} 
      >
        <div className={'room-search__form-wrapper'}>
          <div className={`room-search__date-wrapper`}>
            <RoomSearchItem
              header={t('searchbar.check-in')}
              value={getDateStringFromDate(checkinDate)}
              className={'room-search__date-checkout'}
              isChildrenVisible={isCheckinDatePickerVisible}
              onToggleChildrenVisibility={toggleCheckinDatePickerVisibility}
              children={
                <DatePicker
                  minDate={defaultCheckinDate}
                  onDateChange={handleCheckinChange}
                  defaultDate={checkinDate}
                />
              }
            />
            <RoomSearchItem
              header={t('searchbar.check-out')}
              value={getDateStringFromDate(checkoutDate)}
              className={'room-search__date-checkout'}
              isChildrenVisible={isCheckoutDatePickerVisible}
              onToggleChildrenVisibility={toggleCheckoutDatePickerVisibility}
              children={
                <DatePicker
                  minDate={defaultCheckoutDate}
                  onDateChange={handleCheckoutChange}
                  defaultDate={checkoutDate}
                />
              }
            />
          </div>
          <RoomSearchItem
            header={t('searchbar.guests')}
            value={getGuestsString()}
            className={'room-search__guests'}
            isChildrenVisible={isGuestPickerVisible}
            onToggleChildrenVisibility={toggleGuestPickerVisibility}
            children={
              <GuestsPicker
                onAdultsChange={handleAdultsChange}
                defaultAdults={adults}
                onChildrenChange={handleChildrenChange}
                defaultChildren={children}
              />
            }
          />
          <div className={'room-search__item-wrapper'}>
            <button 
            type="submit"
            formMethod='POST'
            >
              {t('searchbar.search').toUpperCase()}
              </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RoomSearchBar;
