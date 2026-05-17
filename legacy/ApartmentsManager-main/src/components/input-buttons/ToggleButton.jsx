import "./input-buttons.css"
import React, { useState, useEffect } from 'react';

function ToggleButton({ label, onChange, defaultState, disabled }) {
    const [isToggled, setToggled] = useState(defaultState);

    const handleClick = () => {
        if (disabled === true)
            return
        setToggled(!isToggled);
    };
    useEffect(() => {
        if (typeof isToggled === 'boolean') {
            onChange(isToggled);
          }
      }, [isToggled]);

    return (
        <div className="toggle-btn" onClick={handleClick}>
            <label>
                {label}
            </label>
            <div className={`toggle-btn__wrapper ${isToggled ? 'active': 'inactive'}`}>

                <div className={`toggle-btn__dot ${isToggled ? 'active': 'inactive'}`}></div>
            </div>

        </div>
    );
}

export default ToggleButton;