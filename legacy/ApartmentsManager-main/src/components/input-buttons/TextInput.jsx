import React, { useState, useEffect } from 'react';
import './input-buttons.css';

function TextInput({ id, type, className, label, disabled, defaultValue, onChange }) {
  const [value, setValue] = useState(defaultValue ? defaultValue : '');

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setValue(newValue);
    onChange(newValue);
  };
  useEffect(() => {
    setValue(defaultValue);
}, [defaultValue]);
  let inputType = type ? type : 'text'

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
        autoComplete="off"
        disabled={disabled}
        onChange={handleInputChange}
      />
    </div>
  );
}

export default TextInput;
