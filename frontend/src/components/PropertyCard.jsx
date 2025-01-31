import React from 'react';

const PropertyCard = ({ property }) => {
  // Definimos las imágenes por defecto
  const defaultImages = {
    house: '/images/house-placeholder.jpg',
    apartment: '/images/apartment-placeholder.jpg',
    default: '/images/property-placeholder.jpg'
  };

  // Función para manejar errores de carga de imagen
  const handleImageError = (e, type = 'default') => {
    e.target.src = defaultImages[type] || defaultImages.default;
  };

  return (
    <div className="property-card">
      <img 
        src={property.imageUrl || defaultImages[property.type] || defaultImages.default}
        onError={(e) => handleImageError(e, property.type)}
        alt={property.title}
        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
      />
      {/* Resto del contenido de la tarjeta */}
    </div>
  );
};

export default PropertyCard;

const placeholderUrl = 'https://picsum.photos/300/200';   // Servicio alternativo 

// Alternativa usando un servicio más confiable
const getPlaceholderImage = (width = 300, height = 200) => {
  return `https://picsum.photos/${width}/${height}`;
  // o
  // return `https://source.unsplash.com/random/${width}x${height}/?house`;
};  