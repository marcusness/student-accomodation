import ImageSlideshow from './ImageSlideshow';
import '../styles/PropertyCard.css';

const PropertyCard = ({ property }) => {
  return (
    <div className="property-card">
      <ImageSlideshow images={property.images} />
      <div className="property-info">
        <h2 className="property-price">${property.price.toLocaleString()}</h2>
        <div className="property-details">
          <span>{property.bedrooms} beds</span>
          <span>•</span>
          <span>{property.bathrooms} baths</span>
          <span>•</span>
          <span>{property.sqft.toLocaleString()} sqft</span>
        </div>
        <p className="property-address">{property.address}</p>
        <p className="property-description">{property.description}</p>
        
        {/* Virtual Tour Section */}
        {property.virtualTourUrl && (
          <div className="virtual-tour-container">
            <h3>Virtual Tour</h3>
            <iframe
              src={property.virtualTourUrl}
              title="Virtual Tour"
              className="virtual-tour-frame"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard; 