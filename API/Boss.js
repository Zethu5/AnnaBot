const express = require('express');
const mongoose = require('mongoose');
const Boss = require('../MongoDB/Boss');
const route = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

route.post('/', jsonParser, async (req, res) => {
  const { name } = req.body;
  let bossModel = new Boss({ name: name });
  await bossModel.save();
  res.json(bossModel);
});

route.get('/', jsonParser, async (req, res) => {
  await Boss.find({}, function (err, data) {
    res.send(data);
  });
});

route.delete('/', jsonParser, async (req, res) => {
  const { name } = req.body;
  await Boss.deleteOne({ name: name }, function (err, data) {
    res.send(data);
  });
});

module.exports = route;
