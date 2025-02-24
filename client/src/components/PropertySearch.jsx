import { useState } from 'react';
import '../styles/PropertySearch.css';

const PropertySearch = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    type: 'all', // rent or sale
    minPrice: '',
    maxPrice: '',
    bedrooms: 'any',
    university: 'any'
  });

  const universities = [
    'Any University',
    'University of Washington',
    'Seattle University',
    'Seattle Pacific University'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="search-container">
      <div className="search-filters">
        <div className="filter-group">
          <label>Property Type</label>
          <select name="type" value={filters.type} onChange={handleChange}>
            <option value="all">All Properties</option>
            <option value="rent">For Rent</option>
            <option value="sale">For Sale</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Price Range</label>
          <div className="price-inputs">
            <input
              type="number"
              name="minPrice"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={handleChange}
            />
            <span>to</span>
            <input
              type="number"
              name="maxPrice"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Bedrooms</label>
          <select name="bedrooms" value={filters.bedrooms} onChange={handleChange}>
            <option value="any">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Near University</label>
          <select name="university" value={filters.university} onChange={handleChange}>
            {universities.map((uni) => (
              <option 
                key={uni} 
                value={uni === 'Any University' ? 'any' : uni}
              >
                {uni}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PropertySearch; 