const mongoose = require('mongoose');

const quest = new mongoose.Schema({
  type: {
    type: String,
  },
  id: {
    type: String,
  },
  channel_id: {
    type: String,
  },
  timestamp: {
    type: String,
  },
});

module.exports = Quest = mongoose.model('quest', quest);
