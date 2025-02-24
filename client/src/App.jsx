import { useState, useEffect } from 'react';
import PropertyCard from './components/PropertyCard';
import PropertySearch from './components/PropertySearch';
import StudentRegistration from './components/StudentRegistration';
import './App.css';

function App() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    // Fetch properties from your API
    fetch('http://localhost:3000/api/properties')
      .then(response => response.json())
      .then(data => {
        setProperties(data);
        setFilteredProperties(data);
      })
      .catch(error => console.error('Error fetching properties:', error));
  }, []);

  const handleFilterChange = (filters) => {
    let filtered = [...properties];

    // Filter by type (rent/sale)
    if (filters.type !== 'all') {
      filtered = filtered.filter(property => 
        property.type === filters.type
      );
    }

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(property => 
        property.price >= parseInt(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => 
        property.price <= parseInt(filters.maxPrice)
      );
    }

    // Filter by bedrooms
    if (filters.bedrooms !== 'any') {
      filtered = filtered.filter(property => 
        property.bedrooms >= parseInt(filters.bedrooms)
      );
    }

    // Filter by university
    if (filters.university !== 'any') {
      filtered = filtered.filter(property => 
        property.nearUniversity === filters.university
      );
    }

    setFilteredProperties(filtered);
  };

  return (
    <div className="app">
      <h1>Student Accommodation</h1>
      <StudentRegistration />
      <PropertySearch onFilterChange={handleFilterChange} />
      <div className="property-grid">
        {filteredProperties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}

export default App; 