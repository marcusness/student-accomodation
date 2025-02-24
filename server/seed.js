const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const sampleProperties = [
  {
    price: 599000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2100,
    address: '4557 15th Ave NE, Seattle, WA 98105',
    description: 'Beautiful modern home with updated kitchen, hardwood floors, and spacious backyard. Walking distance to UW campus.',
    type: 'sale',
    nearUniversity: 'University of Washington',
    latitude: 47.661475,
    longitude: -122.312543,
    images: [
      'https://example.com/house1a.jpg',
      'https://example.com/house1b.jpg',
      'https://example.com/house1c.jpg'
    ]
  },
  {
    price: 2500,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
    address: '1100 12th Ave, Seattle, WA 98122',
    description: 'Modern apartment with city views, in-unit laundry, and secure parking. 5-minute walk to Seattle University.',
    type: 'rent',
    nearUniversity: 'Seattle University',
    images: [
      'https://example.com/apt1a.jpg',
      'https://example.com/apt1b.jpg'
    ]
  },
  {
    price: 450000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800,
    address: '3469 3rd Ave W, Seattle, WA 98119',
    description: 'Spacious family home near SPU campus. Features updated kitchen, large basement, and mountain views.',
    type: 'sale',
    nearUniversity: 'Seattle Pacific University',
    images: [
      'https://example.com/house2a.jpg',
      'https://example.com/house2b.jpg'
    ]
  },
  {
    price: 1800,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 800,
    address: '4700 Brooklyn Ave NE, Seattle, WA 98105',
    description: 'Cozy studio in the heart of the U-District. Includes parking and utilities.',
    type: 'rent',
    nearUniversity: 'University of Washington',
    images: [
      'https://example.com/studio1a.jpg',
      'https://example.com/studio1b.jpg'
    ]
  },
  {
    price: 3200,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    address: '1111 E Cherry St, Seattle, WA 98122',
    description: 'Newly renovated townhouse with rooftop deck. Perfect for students sharing.',
    type: 'rent',
    nearUniversity: 'Seattle University',
    images: [
      'https://example.com/town1a.jpg',
      'https://example.com/town1b.jpg'
    ]
  },
  {
    price: 725000,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 2400,
    address: '3213 W McGraw St, Seattle, WA 98199',
    description: 'Charming craftsman near SPU with finished basement and large yard.',
    type: 'sale',
    nearUniversity: 'Seattle Pacific University',
    images: [
      'https://example.com/house3a.jpg',
      'https://example.com/house3b.jpg'
    ]
  },
  {
    price: 2100,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    address: '4545 15th Ave NE, Seattle, WA 98105',
    description: 'Updated apartment with balcony and secure entry. All utilities included.',
    type: 'rent',
    nearUniversity: 'University of Washington',
    images: [
      'https://example.com/apt2a.jpg',
      'https://example.com/apt2b.jpg'
    ]
  },
  {
    price: 899000,
    bedrooms: 5,
    bathrooms: 3,
    sqft: 3200,
    address: '901 12th Ave, Seattle, WA 98122',
    description: 'Historic home converted to student housing. Great investment opportunity.',
    type: 'sale',
    nearUniversity: 'Seattle University',
    images: [
      'https://example.com/house4a.jpg',
      'https://example.com/house4b.jpg'
    ]
  }
];

db.serialize(() => {
  // Clear existing data
  db.run('DELETE FROM property_images');
  db.run('DELETE FROM properties');

  // Insert sample properties
  sampleProperties.forEach(property => {
    db.run(`
      INSERT INTO properties (
        price, 
        bedrooms, 
        bathrooms, 
        sqft, 
        address, 
        description, 
        type, 
        nearUniversity,
        latitude,
        longitude
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      property.price,
      property.bedrooms,
      property.bathrooms,
      property.sqft,
      property.address,
      property.description,
      property.type,
      property.nearUniversity,
      property.latitude,
      property.longitude
    ],
    function(err) {
      if (err) {
        console.error('Error inserting property:', err);
        return;
      }

      const propertyId = this.lastID;

      // Insert property images
      property.images.forEach((imageUrl, index) => {
        db.run(`
          INSERT INTO property_images (property_id, image_url, display_order)
          VALUES (?, ?, ?)
        `, [propertyId, imageUrl, index]);
      });
    });
  });
});

console.log('Sample data has been inserted'); 