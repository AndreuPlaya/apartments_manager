import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import "./room-search-item.css";

const RoomSearchItem = ({ header, value, className, children, isChildrenVisible, onToggleChildrenVisibility }) => {

  const toggleChildrenVisibility = () => {
    if (onToggleChildrenVisibility) {
      onToggleChildrenVisibility(!isChildrenVisible);
    }
  };

  return (
    <div className={`room-search__item-wrapper ${className}`} >
      <div className="item-wrapper" onClick={toggleChildrenVisibility}>
        <div className="room-search__item-text">
          {header}
        </div>
        <div className="room-search__item-value">
          <p>{value}</p>
          {isChildrenVisible ? (
            <p><FontAwesomeIcon icon={faChevronUp} /></p>
          ) : (
            <p><FontAwesomeIcon icon={faChevronDown} /></p>
          )}
        </div>
      </div>
      <div className="room-search__children-wrapper" id="children-wrapper">
        {isChildrenVisible && children}
      </div>
    </div>
  );
}

export default RoomSearchItem;
