require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');
const stream = require('stream');

const app = express();
const port = 8080;

// MongoDB Configuration
const uri = process.env.MONGODB_URI;
console.log('MongoDB URI:', uri); // Log the URI to check for correctness
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db, bucket;

async function initializeDb() {
  try {
    await client.connect();
    db = client.db('easy-rent-hub');
    bucket = new GridFSBucket(db, { bucketName: 'images' });
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit process if connection fails
  }
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/properties', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const properties = await db.collection('properties').find({}).toArray();
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/upload', upload.array('images', 10), async (req, res) => {
  try {
    const { title, availableDate, rooms, bathrooms, location, name, price, tags, description } = req.body;
    if (!title || !availableDate || !rooms || !bathrooms || !location || !name || !price || !tags || !description) {
      return res.status(400).send('Missing required fields');
    }

    const sanitizedTitle = sanitizeString(title);
    const sanitizedAvailableDate = sanitizeString(availableDate);
    const sanitizedRooms = sanitizeString(rooms);
    const sanitizedBathrooms = sanitizeString(bathrooms);
    const sanitizedLocation = sanitizeString(location);
    const sanitizedName = sanitizeString(name);
    const sanitizedPrice = parseFloat(price);
    const sanitizedTags = JSON.parse(tags).map(tag => sanitizeString(tag));
    const sanitizedDescription = sanitizeString(description);

    const imageUrls = await Promise.all(req.files.map(async (file) => {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);

      const uploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype
      });

      bufferStream.pipe(uploadStream);

      return new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(`/api/images/${uploadStream.id}`));
        uploadStream.on('error', reject);
      });
    }));

    const property = {
      title: sanitizedTitle,
      availableDate: sanitizedAvailableDate,
      rooms: sanitizedRooms,
      bathrooms: sanitizedBathrooms,
      location: sanitizedLocation,
      name: sanitizedName,
      price: sanitizedPrice,
      tags: sanitizedTags,
      description: sanitizedDescription,
      images: imageUrls,
      rented: false,
    };

    await db.collection('properties').insertOne(property);
    res.status(200).send('Property uploaded successfully!');
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

app.get('/api/images/:id', async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('file', (file) => {
      res.setHeader('Content-Type', file.contentType);
    });

    downloadStream.on('error', (err) => {
      res.status(404).send('File not found');
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.patch('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const propertyData = req.body;

    const result = await db.collection('properties').updateOne({ _id: new ObjectId(id) }, { $set: propertyData });
    if (result.matchedCount === 0) {
      return res.status(404).send('Property not found');
    }

    res.status(200).send('Property updated successfully!');
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add the DELETE route
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('properties').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).send('Property not found');
    }
    res.status(200).send('Property deleted successfully!');
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Internal Server Error');
  }
});

initializeDb().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});

module.exports = app;

const sanitizeString = (str) => {
  return str.replace(/[^\p{L}\p{N}\s.-]/gu, '');
};
