import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import RoomCard from "./RoomCardAnnounce";
import "./room-card-carrousel.css";

const RoomsCarrousel = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [data.length]);

  if (!data || data.length === 0) {
    return <p>No rooms available.</p>;
  }

  // Calculate the visible items, making sure to handle the wrap-around at the end of the array
  const visibleItems = [];
  for (let i = 0; i < itemsPerPage; i++) {
    const index = (currentIndex + i) % data.length;
    visibleItems.push(data[index]);
  }

  return (
    <div className="rooms-carrousel">
      {visibleItems.map((apartment, index) => (
        <RoomCard key={index} room={apartment} />
      ))}
    </div>
  );
};

RoomsCarrousel.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default RoomsCarrousel;
