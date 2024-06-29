const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./server');

let connection;
let db;

beforeAll(async () => {
  connection = await MongoClient.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = await connection.db(global.__MONGO_DB_NAME__);
});

afterAll(async () => {
  if (connection) {
    await connection.close();
  }
  if (db) {
    await db.close();
  }
});

describe('GET /api/properties', () => {
  it('should return an array of properties', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/upload', () => {
  it('should upload a property successfully', async () => {
    const res = await request(app)
      .post('/api/upload')
      .field('title', 'Test Property')
      .field('availableDate', '2024-07-01')
      .field('rooms', '3')
      .field('bathrooms', '2')
      .field('location', 'Test Location')
      .field('name', 'Test Name')
      .field('price', '1000')
      .field('tags', JSON.stringify(['test', 'property']))
      .field('description', 'Test Description')
      .attach('images', 'path/to/test/image.jpg'); // Replace with a valid path to a test image

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Property uploaded successfully!');
  });
});

describe('PATCH /api/properties/:id', () => {
  it('should update a property successfully', async () => {
    const property = await db.collection('properties').insertOne({ name: 'Old Property' });
    const res = await request(app)
      .patch(`/api/properties/${property.insertedId}`)
      .send({ name: 'Updated Property' });

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Property updated successfully!');
  });
});
