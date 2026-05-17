import React, { useState, useEffect } from 'react';
import './slideshow.css';

const Slideshow = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const nextSlide = (currentIndex + 1) % images.length;
    const interval = setInterval(() => {
      setCurrentIndex(nextSlide);
    }, 12000);

    return () => clearInterval(interval);
  }, [currentIndex, images]);

  if (images == null) return null;

  return (
    <div className="slideshow__container">
      {images.map((image, index) => (
        <div
          className={`slideshow__slide slide-${index}`}
          key={index}
          style={{
            backgroundImage: `url(${image.filename})`,
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
          }}
        >
        </div>
      ))}
    </div>
  );
};

export default Slideshow;
