// server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const fileUpload = require('express-fileupload'); // For handling file uploads
const app = express();
const port = process.env.PORT || 3000;

// Load environment variables from .env file
dotenv.config();

// Middleware for file uploads
app.use(fileUpload());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
  await client.connect();
  console.log('Connected to MongoDB');
  return client.db('easy-rent-hub');
}

let db;
connectToDatabase().then(database => {
  db = database;
  const bucket = new GridFSBucket(db, { bucketName: 'images' });

  // Upload image to MongoDB
  app.post('/upload', async (req, res) => {
    try {
      const file = req.files.file; // Assuming you're using express-fileupload
      const uploadStream = bucket.openUploadStream(file.name, {
        contentType: file.mimetype,
      });

      uploadStream.end(file.data);

      uploadStream.on('finish', () => {
        res.status(200).json({ message: 'File uploaded successfully', fileId: uploadStream.id });
      });

      uploadStream.on('error', (error) => {
        console.error('Error uploading file:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  });

  // Serve image files from GridFS
  app.get('/api/images/:id', async (req, res) => {
    try {
      const fileId = new ObjectId(req.params.id);
      const downloadStream = bucket.openDownloadStream(fileId);

      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      downloadStream.on('data', (chunk) => {
        res.write(chunk);
      });

      downloadStream.on('error', (error) => {
        console.error('Error fetching image:', error);
        res.status(404).send('File not found');
      });

      downloadStream.on('end', () => {
        res.end();
      });

    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  });

  // Fetch properties from MongoDB
  app.get('/api/properties', async (req, res) => {
    try {
      const propertiesCollection = db.collection('properties');
      const properties = await propertiesCollection.find().toArray();

      // Set caching headers
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error.message, error.stack);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch(error => {
  console.error('Error connecting to MongoDB:', error);
});
