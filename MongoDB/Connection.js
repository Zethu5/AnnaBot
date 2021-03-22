const mongoose = require('mongoose');
const fs = require('fs');

const raw_data = fs.readFileSync('./config.json');
const { DB_URI } = JSON.parse(raw_data);

const connectMongoDB = async () => {
  await mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('[Database] Connected to MongoDB');
};

module.exports = connectMongoDB;
