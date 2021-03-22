const express = require('express');
const mongoose = require('mongoose');
const Emoji = require('../MongoDB/Emoji');
const route = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

route.post('/', jsonParser, async (req, res) => {
  const { name, id, time } = req.body;
  let emojiModel = new Emoji({ name: name, id: id, time: time });
  await emojiModel.save();
  res.json(emojiModel);
});

route.get('/', jsonParser, async (req, res) => {
  await Emoji.find({}, function (err, data) {
    res.send(data);
  });
});

route.get('/:time', jsonParser, async (req, res) => {
  const { time } = req.params;
  await Emoji.find({ time: time }, function (err, data) {
    res.send(data);
  });
});

route.delete('/', jsonParser, async (req, res) => {
  const { name, id, time } = req.body;
  await Emoji.deleteOne({ name: name, id: id, time: time }, function (
    err,
    data
  ) {
    res.send(data);
  });
});

module.exports = route;
