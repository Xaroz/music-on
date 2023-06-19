import mongoose from 'mongoose';
import dotenv from 'dotenv';

import app from './app';

dotenv.config();

// Set up server
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
