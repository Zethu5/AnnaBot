const express = require('express');
const mongoose = require('mongoose');
const Quest = require('../MongoDB/Quest');
const route = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

route.post('/', jsonParser, async (req, res) => {
  const { type, id, channel_id, timestamp } = req.body;
  let questModel = new Quest({
    type: type,
    id: id,
    channel_id: channel_id,
    timestamp: timestamp,
  });
  await questModel.save();
  res.json(questModel);
});

route.get('/', jsonParser, async (req, res) => {
  await Quest.find({}, function (err, data) {
    res.send(data);
  });
});

route.delete('/', jsonParser, async (req, res) => {
  const { type, id, channel_id, timestamp } = req.body;
  await Quest.deleteOne(
    { type: type, id: id, channel_id: channel_id, timestamp: timestamp },
    function (err, data) {
      res.send(data);
    }
  );
});

module.exports = route;
