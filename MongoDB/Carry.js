const mongoose = require('mongoose');

const carry = new mongoose.Schema({
  boss: {
    type: String,
  },
  discord_name: {
    type: String,
  },

  discord_id: {
    type: String,
  },
});

module.exports = Carry = mongoose.model('carry', carry);
