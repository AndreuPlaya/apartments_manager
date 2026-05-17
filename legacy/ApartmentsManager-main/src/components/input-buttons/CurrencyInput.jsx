import React, { useState } from 'react';
import './input-buttons.css';
function CurrencyInput({ id, className, label, disabled, defaultValue, onChange }) {
  const [value, setValue] = useState(defaultValue ? defaultValue : '');

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setValue(newValue);
    onChange(newValue);
  };
  const formatCurrency = (amount) => {
    const euro = new Intl.NumberFormat('en-DE', {
      style: 'currency',
      currency: 'EUR'
    });
    return euro.format(amount);
  };
  return (
    <div className={`input__wrapper ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}
      <div className="input__value currency__wrapper">
        <input
          id={id}
          type='number'
          value={value}
          min="0.01"
          step="0.01"
          autoComplete="off"
          disabled={disabled}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}

export default CurrencyInput;
