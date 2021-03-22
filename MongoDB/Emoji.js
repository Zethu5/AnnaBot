const mongoose = require('mongoose');

const emoji = new mongoose.Schema({
  name: {
    type: String,
  },
  id: {
    type: String,
  },
  time: {
    type: String,
  },
});

module.exports = Emoji = mongoose.model('emoji', emoji);
