const mongoose = require('mongoose');

const secret = new mongoose.Schema({
  token: {
    type: String,
  },
});

module.exports = Secret = mongoose.model('secret', secret);
