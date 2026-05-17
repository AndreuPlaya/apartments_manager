import React, { useState} from "react";




const TextInputWithSuggestions = ({ id, label, className, disabled, items, onSelection }) => {
    const [filteredItems, setFilteredItems] = useState([]);
    const [value, setValue] = useState("");


    const filterItems = (value) => {
        const trimmedValue = value.trim().toLowerCase();

        if (trimmedValue.length === 0) return [];

        const filteredData = items.filter((item) => {
            const itemName = item.name.toLowerCase();
            return itemName.includes(trimmedValue);
        });

        const sortedData = filteredData.sort((a, b) => a.name.localeCompare(b.name));

        return sortedData;
    };



    const handleInputChange = (event) => {
        const value = event.target.value;
        setValue(value);
    
        if (value) {
            const trimmedValue = value.trim();
            const filteredData = filterItems(trimmedValue);
            setFilteredItems(filteredData);
    
            const matchingItem = filteredData.find(item => item.name === trimmedValue);
    
            if (matchingItem) {
                // If there's a matching item, you can use it
                onSelection(matchingItem);
                setFilteredItems([]);
            } else {
                // If there's no exact match, you can create a new item
                const newItem = {
                    id: '',
                    name: trimmedValue
                };
                onSelection(newItem);
            }
        } else {
            setFilteredItems([]);
            onSelection(null); 
        }
    };

    const handleItemClick = (item) => {
        onSelection(item);
        setValue(item.name);
        setFilteredItems([]);
    };

    return (
        <div className={`input__wrapper ${className}`}>
            {label && (
                <label htmlFor={id}>
                    {label}
                </label>
            )}
            <input
                id={id}
                type='text'
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
};

export default TextInputWithSuggestions;
