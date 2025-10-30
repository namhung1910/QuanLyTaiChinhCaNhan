const mongoose = require('mongoose');

const defaultUri = 'mongodb://127.0.0.1:27017/quanlytaichincanhan';

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || defaultUri;
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
  });
  console.log('MongoDB connected');
}

module.exports = { connectDatabase };


