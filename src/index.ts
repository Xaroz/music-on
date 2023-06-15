import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Set up Express app
const app = express();
const port = process.env.PORT || 3000;

const DB = process.env.MONGODB_URL
  ? process.env.MONGODB_URL.replace(
      '<password>',
      process.env.MONGODB_PASSOWRD || ''
    )
  : '';

// Connect to MongoDB
mongoose
  .connect(DB)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Define a sample route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
