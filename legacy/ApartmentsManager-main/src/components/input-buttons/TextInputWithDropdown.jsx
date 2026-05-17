import React, { useState } from 'react';
import './input-buttons.css';

function TextInputWithDropdown({ id, type, className, label, disabled, defaultValue, onChange, itemList }) {
  const [value, setValue] = useState(defaultValue ? defaultValue : '');
  const [filteredItems, setFilteredItems] = useState([]);

  const removeDiacritics = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setValue(newValue);

    const filtered = itemList.filter(item => removeDiacritics(item.name.toLowerCase()).includes(newValue.toLowerCase()));
    if (newValue === '') {
      setFilteredItems([]);
    }
    else {
      setFilteredItems(filtered);
    }
  };

  const handleItemClick = (selectedItem) => {
    setValue(selectedItem.name);
    setFilteredItems([]);
    onChange(selectedItem.value);
  };

  let inputType = type ? type : 'text';

  return (
    <div className={`input__wrapper ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={inputType}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={handleInputChange}
      />
      {filteredItems.length > 0 && (
        <ul className="dropdown-list">
          {filteredItems.map((item, index) => (
            <li key={index} onClick={() => handleItemClick(item)}>
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TextInputWithDropdown;
