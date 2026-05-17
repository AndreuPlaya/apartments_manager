import React, { useState, useEffect } from 'react';
import './input-buttons.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

function Dropdown({ id, className, label, defaultValue, disabled, onChange, itemList }) {
  const [value, setValue] = useState(defaultValue ? defaultValue.name : '');
  const [isChildrenVisible, setChildrenVisible] = useState(false);

  useEffect(() => {
    setValue(defaultValue ? defaultValue.name : '');
  }, [defaultValue]);

  const toggleVisibility = () => {
    if (disabled) return
    setChildrenVisible(!isChildrenVisible);
  };

  const handleItemClick = (selectedItem) => {
    setValue(selectedItem.name);
    setChildrenVisible(false);
    onChange(selectedItem);
  };

  return (
    <div className={`input__wrapper ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}
      <div className="input__value pointer" onClick={toggleVisibility}>
        <p>{value}</p>
        <p>{isChildrenVisible ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />} </p>
      </div>
      <ul className={`dropdown-list ${isChildrenVisible ? "visible" : "not-visible"}`}>
        {itemList.map((item, index) => (
          <li key={index} onClick={() => handleItemClick(item)}>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dropdown;
