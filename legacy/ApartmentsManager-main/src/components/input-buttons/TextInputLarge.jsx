import React, { useState } from 'react';
import './input-buttons.css';

function TextInputLarge({ id, type, className, label, disabled, defaultValue, onChange }) {
  const [value, setValue] = useState(defaultValue ? defaultValue : '');

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setValue(newValue);
    onChange(newValue);
  };
  let inputType = type ? type : 'text'

  return (
    <div className={`input__wrapper ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        type={inputType}
        value={value}
        autoComplete="off"
        disabled={disabled}
        onChange={handleInputChange}
      />
    </div>
  );
}

export default TextInputLarge;
