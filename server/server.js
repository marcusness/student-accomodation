const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();
const PDFDocument = require('pdfkit');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    'https://student-accomodation.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Database connection
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Update database schema
db.serialize(() => {
  // Properties table with new location fields
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price INTEGER NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      sqft INTEGER NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('rent', 'sale')),
      nearUniversity TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add helper function for distance calculation
  db.run(`
    CREATE FUNCTION IF NOT EXISTS distance(lat1 REAL, lon1 REAL, lat2 REAL, lon2 REAL)
    RETURNS REAL
    BEGIN
      RETURN 3959 * 2 * ASIN(SQRT(
        POWER(SIN((lat2 - lat1) * PI() / 180 / 2), 2) +
        COS(lat1 * PI() / 180) * COS(lat2 * PI() / 180) *
        POWER(SIN((lon2 - lon1) * PI() / 180 / 2), 2)
      ));
    END;
  `);

  // Property images table with foreign key relationship
  db.run(`
    CREATE TABLE IF NOT EXISTS property_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties (id)
    )
  `);
});

// Example table creation
db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Example route
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get all properties with filtering
app.get('/api/properties', (req, res) => {
  const {
    type,
    minPrice,
    maxPrice,
    bedrooms,
    university,
    latitude,
    longitude,
    maxDistance
  } = req.query;

  let query = `
    SELECT 
      p.*,
      GROUP_CONCAT(pi.image_url) as images,
      CASE 
        WHEN ? AND ? 
        THEN distance(p.latitude, p.longitude, ?, ?)
        ELSE NULL 
      END as distance
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id
  `;

  const whereConditions = [];
  const params = [
    latitude || null,
    longitude || null,
    latitude || 0,
    longitude || 0
  ];

  // Add filter conditions
  if (type && type !== 'all') {
    whereConditions.push('p.type = ?');
    params.push(type);
  }

  if (minPrice) {
    whereConditions.push('p.price >= ?');
    params.push(minPrice);
  }

  if (maxPrice) {
    whereConditions.push('p.price <= ?');
    params.push(maxPrice);
  }

  if (bedrooms && bedrooms !== 'any') {
    whereConditions.push('p.bedrooms >= ?');
    params.push(bedrooms);
  }

  if (university && university !== 'any') {
    whereConditions.push('p.nearUniversity = ?');
    params.push(university);
  }

  // Add distance filter if coordinates and maxDistance provided
  if (latitude && longitude && maxDistance) {
    whereConditions.push('distance(p.latitude, p.longitude, ?, ?) <= ?');
    params.push(latitude, longitude, maxDistance);
  }

  // Add WHERE clause if there are any conditions
  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  // Add GROUP BY and ORDER BY
  query += ` 
    GROUP BY p.id
    ORDER BY 
      CASE 
        WHEN ? AND ? THEN distance 
        ELSE p.created_at 
      END
  `;
  params.push(latitude || null, longitude || null);

  db.all(query, params, (err, properties) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Format the response
    const formattedProperties = properties.map(property => ({
      ...property,
      images: property.images ? property.images.split(',') : [],
      distance: property.distance ? Math.round(property.distance * 10) / 10 : null
    }));
    
    res.json(formattedProperties);
  });
});

// Get single property by ID (updated to include new fields)
app.get('/api/properties/:id', (req, res) => {
  const query = `
    SELECT 
      p.*,
      GROUP_CONCAT(pi.image_url) as images
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  db.get(query, [req.params.id], (err, property) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    // Format the response
    property.images = property.images ? property.images.split(',') : [];
    res.json(property);
  });
});

// Create new property (updated to include new fields)
app.post('/api/properties', (req, res) => {
  const {
    price,
    bedrooms,
    bathrooms,
    sqft,
    address,
    description,
    type,
    nearUniversity,
    latitude,
    longitude,
    images
  } = req.body;

  // Validate required fields
  if (!price || !bedrooms || !bathrooms || !sqft || !address || 
      !description || !type || !latitude || !longitude) {
    res.status(400).json({ error: 'Required fields are missing' });
    return;
  }

  // Validate property type
  if (!['rent', 'sale'].includes(type)) {
    res.status(400).json({ error: 'Invalid property type. Must be "rent" or "sale"' });
    return;
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [price, bedrooms, bathrooms, sqft, address, description, type, nearUniversity, latitude, longitude],
    function(err) {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }

      const propertyId = this.lastID;

      // Insert images if provided
      if (images && images.length > 0) {
        const imageInsertStmt = db.prepare(`
          INSERT INTO property_images (property_id, image_url, display_order)
          VALUES (?, ?, ?)
        `);

        images.forEach((imageUrl, index) => {
          imageInsertStmt.run(propertyId, imageUrl, index);
        });

        imageInsertStmt.finalize();
      }

      db.run('COMMIT');
      res.status(201).json({
        id: propertyId,
        message: 'Property created successfully'
      });
    });
  });
});

// Get available universities (new endpoint)
app.get('/api/universities', (req, res) => {
  const query = `
    SELECT DISTINCT nearUniversity
    FROM properties
    WHERE nearUniversity IS NOT NULL
    ORDER BY nearUniversity
  `;

  db.all(query, [], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const universities = results
      .map(result => result.nearUniversity)
      .filter(Boolean);
    
    res.json(universities);
  });
});

// Add a new endpoint to search properties by location
app.get('/api/properties/nearby', (req, res) => {
  const { latitude, longitude, radius = 5 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const query = `
    SELECT 
      p.*,
      GROUP_CONCAT(pi.image_url) as images,
      distance(p.latitude, p.longitude, ?, ?) as distance
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id
    WHERE distance(p.latitude, p.longitude, ?, ?) <= ?
    GROUP BY p.id
    ORDER BY distance
  `;

  db.all(query, [
    latitude,
    longitude,
    latitude,
    longitude,
    radius
  ], (err, properties) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const formattedProperties = properties.map(property => ({
      ...property,
      images: property.images ? property.images.split(',') : [],
      distance: Math.round(property.distance * 10) / 10
    }));

    res.json(formattedProperties);
  });
});

// Helper function to fetch image from URL
function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Generate PDF flyer endpoint
app.get('/api/properties/:id/flyer', async (req, res) => {
  const propertyId = req.params.id;

  // Fetch property data
  const query = `
    SELECT 
      p.*,
      GROUP_CONCAT(pi.image_url) as images
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  db.get(query, [propertyId], async (err, property) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    // Format property data
    property.images = property.images ? property.images.split(',') : [];

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=property-${propertyId}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    try {
      // Add header with property type and price
      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(`${property.type === 'sale' ? 'For Sale' : 'For Rent'}`, { align: 'center' })
        .fontSize(20)
        .text(`$${property.price.toLocaleString()}${property.type === 'rent' ? '/month' : ''}`, { align: 'center' })
        .moveDown();

      // Add main image if available
      if (property.images.length > 0) {
        const imageBuffer = await fetchImageBuffer(property.images[0]);
        doc.image(imageBuffer, {
          fit: [500, 300],
          align: 'center'
        });
        doc.moveDown();
      }

      // Add property details
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('Property Details', { underline: true })
        .moveDown(0.5);

      doc.font('Helvetica').fontSize(12);

      // Address
      doc.text(`Address: ${property.address}`);
      
      // Property specs
      doc.text(`Bedrooms: ${property.bedrooms}`)
         .text(`Bathrooms: ${property.bathrooms}`)
         .text(`Square Footage: ${property.sqft.toLocaleString()} sq ft`)
         .moveDown();

      // Near university if applicable
      if (property.nearUniversity) {
        doc.text(`Near: ${property.nearUniversity}`).moveDown();
      }

      // Description
      doc
        .font('Helvetica-Bold')
        .text('Description', { underline: true })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .text(property.description)
        .moveDown();

      // Add map if coordinates are available
      if (property.latitude && property.longitude) {
        doc
          .font('Helvetica-Bold')
          .text('Location', { underline: true })
          .moveDown(0.5);

        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
          `center=${property.latitude},${property.longitude}&zoom=15&size=500x300&` +
          `markers=color:red%7C${property.latitude},${property.longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`;

        try {
          const mapBuffer = await fetchImageBuffer(mapUrl);
          doc.image(mapBuffer, {
            fit: [500, 300],
            align: 'center'
          });
        } catch (error) {
          console.error('Error fetching map:', error);
        }
      }

      // Add footer with contact information
      doc
        .moveDown()
        .fontSize(10)
        .text('For more information, contact:', { align: 'center' })
        .text('Real Estate Office: (555) 123-4567', { align: 'center' })
        .text('Email: info@realestate.com', { align: 'center' });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      console.error('Error generating PDF:', error);
      // If we haven't sent the response yet, send an error
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error generating PDF' });
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Student registration endpoint
app.post('/api/students/register', (req, res) => {
  const {
    firstName,
    lastName,
    email,
    studentId,
    university,
    major,
    graduationYear,
    phoneNumber,
    preferredContact
  } = req.body;

  // For now, just return success (we'll add proper database later)
  res.status(201).json({
    message: 'Student registered successfully',
    data: {
      firstName,
      lastName,
      email,
      studentId,
      university,
      major,
      graduationYear,
      phoneNumber,
      preferredContact
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

// For Vercel
module.exports = app; 