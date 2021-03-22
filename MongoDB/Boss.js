const mongoose = require('mongoose');

const boss = new mongoose.Schema({
  name: {
    type: String,
  },
});

module.exports = Boss = mongoose.model('boss', boss);
