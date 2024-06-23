const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const app = express();
const port = 3000;

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://easy-rent-hub-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.firestore();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/properties', async (req, res) => {
  try {
    const propertiesSnapshot = await db.collection('properties').get();
    const properties = propertiesSnapshot.docs.map(doc => doc.data());
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Retrieve the QR Codes
app.get('/api/qrcodes', async (req, res) => {
  try {
    const qrCodesSnapshot = await db.collection('qrCodes').get();
    const qrCodes = qrCodesSnapshot.docs.map(doc => doc.data());
    res.json(qrCodes);
    console.log(qrCodes);
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
